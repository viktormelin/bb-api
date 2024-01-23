import { Request, Response } from 'express';
import prismaClient from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { calculateTransactions } from '../../utils/minimizeTransactions';

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

interface RequestBody {
  targetId: string;
  groupId: string;
  expenseId: string;
}
const addUserToExpense = async (req: Request, res: Response) => {
  const { targetId, groupId, expenseId }: RequestBody = req.body;
  const userId = req.user?.sub;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!targetId || targetId.length <= 0)
    return res.status(400).json({ error: 'Missing target user' });
  if (!groupId || groupId.length <= 0)
    return res.status(400).json({ error: 'Missing target group' });
  if (!expenseId || expenseId.length <= 0)
    return res.status(400).json({ error: 'Missing target expense' });

  try {
    const userGroups = await prismaClient.authorizer_users.findUnique({
      where: {
        id: userId,
      },
      select: {
        group_users: {
          select: {
            groupsId: true,
          },
        },
      },
    });

    if (!userGroups?.group_users.some((group) => group.groupsId === groupId))
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

export default { getMyExpenses, getExpense, addUserToExpense };
