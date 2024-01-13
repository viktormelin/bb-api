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
  const { name, users, expense } = req.body;
  const userId = req.user?.sub;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  if (!name) return res.status(400).json({ error: 'Missing group name' });
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
    const expenseQuery = JSON.parse(expense);

    if (!expenseQuery) throw new Error('Failed to decompile expense details');

    if (users && users.length > 0) {
      const decompiled = JSON.parse(users) as string[];
      if (!decompiled || decompiled.length <= 0) return;

      for (const email of decompiled) {
        if (userEmail.email === email) {
          userQuery.push({
            user: { connect: { email } },
            role: 'owner',
          });
        } else {
          userQuery.push({
            user: { connect: { email } },
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

    const group = await prismaClient.groups.create({
      data: {
        name,
        users: {
          create: [...userQuery],
        },
        expenses: {
          create: expenseQuery,
        },
      },
    });

    if (!group)
      return res.status(500).json({ error: 'Failed to create new group' });

    return res.status(201).json({ group });
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
