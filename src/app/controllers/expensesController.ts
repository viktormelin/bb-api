import { Request, Response } from 'express';
import prismaClient from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { calculateTransactions } from '../../utils/minimizeTransactions';
import { isPartOfGroup } from '../../utils/authorizer';

const getMyExpenses = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  try {
    const expenses = await prismaClient.authorizer_users.findUnique({
      where: {
        id: userId,
      },
      select: {
        group_users: {
          include: {
            expense_splits: {
              include: {
                expense: true,
              },
            },
          },
        },
      },
    });

    if (!expenses || !expenses.group_users)
      return res.status(404).json({ error: 'No groups found for the user' });

    let compiledExpenses: any[] = [];

    if (expenses.group_users.length > 0) {
      for (const user of expenses.group_users) {
        compiledExpenses = user.expense_splits.map((expense) => expense);
      }
    }

    return res.status(200).json({ expenses: compiledExpenses });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

const getExpense = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const expenseId = req.params.id;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!expenseId)
    return res.status(400).json({ error: 'No group id specified' });

  try {
    const expense = await prismaClient.expenses.findUnique({
      where: {
        id: expenseId,
      },
      include: {
        expense_splits: {
          include: {
            group_user: {
              include: {
                auth_user: {
                  select: {
                    given_name: true,
                    family_name: true,
                  },
                },
              },
            },
          },
        },
        initial_payer: {
          include: {
            auth_user: {
              select: {
                given_name: true,
                family_name: true,
              },
            },
          },
        },
        connected_group: {
          include: {
            users: {
              include: {
                auth_user: {
                  select: {
                    given_name: true,
                    family_name: true,
                  },
                },
              },
            },
            expenses: true,
          },
        },
      },
    });

    if (!expense)
      return res
        .status(404)
        .json({ error: 'No expense found with the specified ID' });

    return res.status(200).json({ expense });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

interface RequestBody1 {
  targetId: string;
  groupId: string;
  expenseId: string;
}
const addUserToExpense = async (req: Request, res: Response) => {
  const { targetId, groupId, expenseId }: RequestBody1 = req.body;
  const userId = req.user?.sub;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!targetId || targetId.length <= 0)
    return res.status(400).json({ error: 'Missing target user' });
  if (!groupId || groupId.length <= 0)
    return res.status(400).json({ error: 'Missing target group' });
  if (!expenseId || expenseId.length <= 0)
    return res.status(400).json({ error: 'Missing target expense' });

  try {
    if (!isPartOfGroup(userId, groupId))
      return res
        .status(403)
        .json({ error: 'You are not a member of this group' });

    const dbExpense = await prismaClient.expenses.findUnique({
      where: {
        id: expenseId,
      },
      include: {
        initial_payer: true,
        expense_splits: true,
      },
    });

    if (!dbExpense)
      return res
        .status(404)
        .json({ error: 'Could not find expense with the provided ID' });

    const splitAmount =
      dbExpense.expense_total / (dbExpense.expense_splits.length + 1);
    const splitPercentage = 100 / (dbExpense.expense_splits.length + 1);

    const updatedSplits = await prismaClient.expense_splits.updateMany({
      where: {
        expensesId: dbExpense.id,
      },
      data: {
        amount: splitAmount,
        percentage: splitPercentage,
      },
    });

    if (!updatedSplits) throw new Error('Failed to update current splits');

    const newExpenseSplit = await prismaClient.expense_splits.create({
      data: {
        amount: splitAmount,
        percentage: splitPercentage,
        expense: {
          connect: {
            id: expenseId,
          },
        },
        group_user: {
          connect: {
            id: targetId,
          },
        },
      },
    });

    if (!newExpenseSplit) throw new Error('Failed to create new expense split');

    return res.status(201).json({ expense_split: newExpenseSplit });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

interface RequestBody2 {
  targetId: string;
  groupId: string;
  expenseId: string;
  updatedSplit: string | number;
}
const editExpenseSplit = async (req: Request, res: Response) => {
  const { targetId, groupId, expenseId, updatedSplit }: RequestBody2 = req.body;
  const userId = req.user?.sub;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!targetId || targetId.length <= 0)
    return res.status(400).json({ error: 'Missing target user' });
  if (!groupId || groupId.length <= 0)
    return res.status(400).json({ error: 'Missing target group' });
  if (!expenseId || expenseId.length <= 0)
    return res.status(400).json({ error: 'Missing target expense' });
  if (!updatedSplit)
    return res.status(400).json({ error: 'Missing update amount' });

  if (Number(updatedSplit) > 100 || Number(updatedSplit) < 0)
    return res.status(400).json({ error: 'Invalid amount specified' });

  if (!isPartOfGroup(userId, groupId))
    return res
      .status(403)
      .json({ error: 'You are not a member of this group' });

  const dbExpense = await prismaClient.expenses.findUnique({
    where: {
      id: expenseId,
    },
    include: {
      initial_payer: true,
      expense_splits: {
        include: {
          group_user: true,
        },
      },
    },
  });

  if (!dbExpense)
    return res
      .status(404)
      .json({ error: 'Could not find expense with the provided ID' });

  const oldSplits = dbExpense.expense_splits;
  const nonManualSplits = oldSplits.filter((split) => !split.manual);
  const manualSplits = oldSplits.filter((split) => split.manual);

  const calculateAmounts = () => {
    let nonManualSum = 0;
    let nonManualPercent = 0;

    let manualSum = 0;
    let manualPercentage = 0;

    for (const split of nonManualSplits) {
      nonManualSum += split.amount;
      nonManualPercent += split.percentage;
    }
    for (const split of manualSplits) {
      manualSum += split.amount;
      manualPercentage += split.percentage;
    }

    return { nonManualSum, nonManualPercent, manualSum, manualPercentage };
  };

  if (nonManualSplits.length > 0) {
    // do any splits that are not manually set exist?
    const targetSplitAmount =
      dbExpense.expense_total * (Number(updatedSplit) / 100);
    const calculatedAmounts = calculateAmounts();

    const amountRest = calculatedAmounts.nonManualSum - targetSplitAmount;
    const percentageRest =
      calculatedAmounts.nonManualPercent - Number(updatedSplit);

    let splitId = null;
    const newSplits = oldSplits.map((split) => {
      splitId = split.id;

      if (split.group_usersId === targetId) {
        return {
          ...split,
          percentage: updatedSplit,
          amount: targetSplitAmount,
          manual: true,
        };
      } else if (split.manual) {
        return split;
      } else {
        return {
          ...split,
          percentage: percentageRest / (nonManualSplits.length - 1),
          amount: amountRest / (nonManualSplits.length - 1),
          manual: false,
        };
      }
    });

    const sumOfNewSplits = newSplits.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    if (sumOfNewSplits === dbExpense.expense_total) {
      if (!splitId)
        throw new Error('Failed to find ID of expense split while mapping');

      for (const split of newSplits) {
        await prismaClient.expense_splits.update({
          where: {
            id: split.id,
          },
          data: {
            percentage: Number(split.percentage),
            amount: split.amount,
            manual: split.manual,
          },
        });
      }

      return res.status(200).send('Successfully updated split');
    } else {
      return res
        .status(400)
        .json({ error: 'Values provided for amount does not match total sum' });
    }
  } else {
    // no splits exists that are not manually set, check if amount is allowed instead
    const splitAmount = dbExpense.expense_total * (Number(updatedSplit) / 100);
    let splitId = null;

    const newSplits = oldSplits.map((split) => {
      splitId = split.id;

      if (split.group_usersId === targetId) {
        return {
          ...split,
          percentage: updatedSplit,
          amount: splitAmount,
          manual: true,
        };
      } else {
        return split;
      }
    });

    const sumOfNewSplits = newSplits.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    if (sumOfNewSplits === dbExpense.expense_total) {
      if (!splitId)
        throw new Error('Failed to find ID of expense split while mapping');

      const updatedExpenseSplit = await prismaClient.expense_splits.update({
        where: {
          id: splitId,
        },
        data: {
          percentage: Number(updatedSplit),
          amount: splitAmount,
          manual: true,
        },
      });

      if (updatedExpenseSplit)
        return res.status(200).send('Successfully updated split');

      return res.status(500).json({ error: 'Something went wrong' });
    } else {
      return res
        .status(400)
        .json({ error: 'Values provided for amount does not match total sum' });
    }
  }
};

interface RequestBody3 {
  group: { name: string; id: string };
  expense: { name: string; expense_total: number };
}
const createExpense = async (req: Request, res: Response) => {
  const { group, expense }: RequestBody3 = req.body;

  const userId = req.user?.sub;

  // expense: { name: expenseName, expense_total: Number(expenseAmount) },

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!group || group.name.length <= 0 || group.id.length <= 0)
    return res.status(400).json({ error: 'Missing group details' });
  if (!expense || !Number(expense.expense_total) || !expense.name)
    return res.status(400).json({ error: 'Missing initial expense details' });

  if (!isPartOfGroup(userId, group.id))
    return res
      .status(403)
      .json({ error: 'You are not a member of this group' });

  try {
    const dbGroup = await prismaClient.groups.findUnique({
      where: {
        id: group.id,
      },
    });

    if (!dbGroup) throw new Error(`Failed to find group with id: ${group.id}`);

    const userEmail = await prismaClient.authorizer_users.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!userEmail || !userEmail.email)
      throw new Error(`Failed to find email of user requested [${userId}]`);

    const myGroups = await prismaClient.authorizer_users.findUnique({
      where: {
        id: userId,
      },
      include: {
        group_users: true,
      },
    });

    const currentGroupUser = myGroups?.group_users.find(
      (v) => v.groupsId === group.id,
    );

    if (!currentGroupUser)
      throw new Error(
        `Could not find group_user of userId: ${userId} connected to group: ${group.id}`,
      );

    const groupExpense = await prismaClient.expenses.create({
      data: {
        name: expense.name,
        initial_payer: {
          connect: {
            id: currentGroupUser.id,
          },
        },
        expense_total: expense.expense_total,
        connected_group: {
          connect: {
            id: dbGroup.id,
          },
        },
        expense_splits: {
          create: {
            amount: expense.expense_total,
            percentage: 100,
            group_user: {
              connect: {
                id: currentGroupUser.id,
              },
            },
          },
        },
      },
    });

    if (!groupExpense)
      throw new Error(
        'Failed to create expense. Check prisma error for more information',
      );

    logger.info(`${userId} created new expense ${groupExpense.id}`);
    return res.status(201).json({ expense: groupExpense });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

const resetExpense = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const expenseId = req.params.id;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!expenseId)
    return res.status(400).json({ error: 'No group id specified' });

  const dbExpense = await prismaClient.expenses.findUnique({
    where: {
      id: expenseId,
    },
    include: {
      initial_payer: true,
      expense_splits: {
        include: {
          group_user: true,
        },
      },
    },
  });

  if (!dbExpense?.groupsId)
    throw new Error('Failed to find id of group associated with this expense');

  if (!isPartOfGroup(userId, dbExpense?.groupsId))
    return res
      .status(403)
      .json({ error: 'You are not a member of this group' });

  try {
    const totSum = dbExpense.expense_total;
    const totPayers = dbExpense.expense_splits.length;

    const eachAmount = totSum / totPayers;
    const eachPercentage = 100 / totPayers;

    for (const split of dbExpense.expense_splits) {
      await prismaClient.expense_splits.update({
        where: {
          id: split.id,
        },
        data: {
          percentage: eachPercentage,
          amount: eachAmount,
          manual: false,
        },
      });
    }

    logger.info(`${userId} reset expense ${expenseId}`);
    return res.status(200).send('Successfully reset splits');
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

export default {
  getMyExpenses,
  getExpense,
  addUserToExpense,
  editExpenseSplit,
  createExpense,
  resetExpense,
};
