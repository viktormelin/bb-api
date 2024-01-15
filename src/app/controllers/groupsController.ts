import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import prismaClient from '../../utils/prisma';

const getMyGroups = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  try {
    const groups = await prismaClient.authorizer_users.findUnique({
      where: {
        id: userId,
      },
      select: {
        group_users: {
          include: {
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

const createNewGroup = async (req: Request, res: Response) => {
  const { group, users, expense } = req.body;
  const userId = req.user?.sub;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!group || group.name.length <= 0)
    return res.status(400).json({ error: 'Missing group name' });
  if (!expense)
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
        users: {
          create: {
            user: {
              connect: {
                email: userEmail.email,
              },
            },
            role: 'owner',
          },
        },
        expenses: {
          create: {
            expense_total: Number(expense.expense_total),
            name: expense.name,
          },
        },
      },
    });

    if (!dbGroup)
      return res.status(500).json({ error: 'Failed to create new group' });

    const createdGroup = await prismaClient.groups.findUnique({
      where: {
        id: dbGroup.id,
      },
      include: {
        expenses: true,
        users: true,
      },
    });

    const expensesId = createdGroup?.expenses[0].id;
    const group_usersId = createdGroup?.users[0].id;

    if (!expensesId || !group_usersId)
      throw new Error('Failed to fetch required id(s) from database object');

    await prismaClient.expense_splits.create({
      data: {
        expensesId,
        group_usersId,
        money_total: Number(expense.expense_total),
        money_share: 1,
      },
    });

    logger.info(`${userId} created new group ${dbGroup.id}`);
    return res.status(201).json({ group: dbGroup });
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
};
