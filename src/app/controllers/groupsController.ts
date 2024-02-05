import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import prismaClient from '../../utils/prisma';
import {
  IExpense,
  calculateTransactions,
} from '../../utils/minimizeTransactions';
import { isPartOfGroup } from '../../utils/authorizer';

const getMyGroups = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  try {
    const groups = await prismaClient.authorizer_users.findUnique({
      where: {
        id: userId,
      },
      include: {
        group_users: {
          include: {
            expenses: true,
            groups: {
              include: {
                expenses: true,
                users: true,
              },
            },
            expense_splits: true,
          },
        },
      },
    });

    return res.status(200).json({ groups: groups?.group_users });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

interface RequestBody {
  group: { name: string };
  expense: { name: string; expense_total: number };
}
const createNewGroup = async (req: Request, res: Response) => {
  const { group, expense }: RequestBody = req.body;
  const userId = req.user?.sub;

  // expense: { name: expenseName, expense_total: Number(expenseAmount) },

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!group || group.name.length <= 0)
    return res.status(400).json({ error: 'Missing group name' });
  if (!expense || !Number(expense.expense_total) || !expense.name)
    return res.status(400).json({ error: 'Missing initial expense details' });

  try {
    const userEmail = await prismaClient.authorizer_users.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!userEmail || !userEmail.email)
      throw new Error(`Failed to find email of user requested [${userId}]`);

    const dbGroup = await prismaClient.groups.create({
      data: {
        name: group.name,
      },
    });

    const groupUser = await prismaClient.group_users.create({
      data: {
        group_role: 'owner',
        auth_user: {
          connect: {
            email: userEmail.email,
          },
        },
        groups: {
          connect: {
            id: dbGroup.id,
          },
        },
      },
    });

    const groupExpense = await prismaClient.expenses.create({
      data: {
        name: expense.name,
        initial_payer: {
          connect: {
            id: groupUser.id,
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
                id: groupUser.id,
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

    logger.info(`${userId} created new group ${dbGroup.id}`);
    return res.status(201).json({ group: dbGroup });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

const getGroup = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const groupId = req.params.id;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!groupId) return res.status(400).json({ error: 'No group id specified' });

  try {
    const group = await prismaClient.groups.findUnique({
      where: {
        id: groupId,
      },
      include: {
        expenses: {
          include: {
            initial_payer: true,
            expense_splits: true,
          },
        },
        users: {
          include: {
            auth_user: {
              select: {
                given_name: true,
                family_name: true,
                picture: true,
              },
            },
          },
        },
      },
    });

    if (group?.users.some((user) => user.authorizer_usersId === userId)) {
      return res.status(200).json({ group });
    } else {
      return res
        .status(403)
        .json({ error: 'You are not a member of this group' });
    }
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

const joinGroup = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const joinToken = req.params.id;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!joinToken)
    return res.status(400).json({ error: 'No group id specified' });

  try {
    const groupId = await prismaClient.groups.findFirst({
      where: {
        invite_link: joinToken,
      },
      select: {
        id: true,
      },
    });

    if (!groupId)
      return res.status(400).json({ error: 'No group with that join token' });

    const groups = await prismaClient.group_users.findMany({
      where: {
        authorizer_usersId: userId,
      },
      select: {
        groupsId: true,
      },
    });

    if (groups.some((v) => v.groupsId === groupId.id))
      return res.status(400).json({ error: 'User is already in this group' });

    const userEmail = await prismaClient.authorizer_users.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!userEmail || !userEmail.email)
      throw new Error(`Failed to find email of user requested [${userId}]`);

    const groupUser = await prismaClient.group_users.create({
      data: {
        group_role: 'user',
        auth_user: {
          connect: {
            email: userEmail.email,
          },
        },
        groups: {
          connect: {
            id: groupId.id,
          },
        },
      },
    });

    if (!groupUser)
      throw new Error(
        'Failed to create group user. Check prisma error for more information',
      );

    logger.info(`Connected ${userId} to ${groupId}`);
    return res.status(201).json({ group: groupId });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

const calculateGroupSplits = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const groupId = req.params.id;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!groupId) return res.status(400).json({ error: 'No group id specified' });

  try {
    const group = await prismaClient.groups.findUnique({
      where: {
        id: groupId,
      },
      include: {
        expenses: {
          include: {
            initial_payer: true,
            expense_splits: true,
          },
        },
      },
    });

    if (!group?.expenses || group.expenses.length <= 0)
      return res.status(400).json({ error: 'This group has no expenses' });

    const calculatedSplitsData: IExpense[] = [];

    for (const expense of group.expenses) {
      calculatedSplitsData.push({
        ...expense,
        initial_payer: expense.initial_payer,
        expense_splits: expense.expense_splits,
      });
    }

    const calculatedSplits = calculateTransactions(calculatedSplitsData);

    return res.status(200).json({ data: calculatedSplits });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

const settleGroupExpenses = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const groupId = req.params.id;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!groupId) return res.status(400).json({ error: 'No group id specified' });

  if (!isPartOfGroup(userId, groupId))
    return res
      .status(403)
      .json({ error: 'You are not a member of this group' });

  try {
    const group = await prismaClient.groups.findUnique({
      where: {
        id: groupId,
      },
      include: {
        expenses: true,
      },
    });

    if (!group?.expenses || group.expenses.length <= 0)
      return res.status(400).json({ error: 'This group has no expenses' });

    const updatedGroupExpenses = group.expenses.map((expense) => ({
      ...expense,
      settled: true,
    }));

    const updatedGroup = await prismaClient.groups.update({
      where: {
        id: groupId,
      },
      data: updatedGroupExpenses,
    });

    if (!updatedGroup) throw new Error('Failed to update group');
    return res.status(200).send('Settled all expenses');
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

export default {
  getMyGroups,
  createNewGroup,
  getGroup,
  joinGroup,
  calculateGroupSplits,
  settleGroupExpenses,
};
