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
            groups: true,
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

    const userQuery = [];

    if (users && users.length > 0) {
      for (const user of users) {
        if (userEmail.email === user.name) {
          userQuery.push({
            user: { connect: { email: user.name } },
            role: 'owner',
          });
        } else {
          userQuery.push({
            user: { connect: { email: user.name } },
            role: 'user',
          });
        }
      }
    } else {
      userQuery.push({
        user: { connect: { email: userEmail.email } },
        role: 'owner',
      });
    }

    const dbGroup = await prismaClient.groups.create({
      data: {
        name: group.name,
        users: {
          create: [...userQuery],
        },
        expenses: {
          create: {
            money_total: Number(expense.money_total),
            name: expense.name,
          },
        },
      },
    });

    if (!dbGroup)
      return res.status(500).json({ error: 'Failed to create new group' });

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
