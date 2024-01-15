import { Request, Response } from 'express';
import prismaClient from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { expense_splits, expenses } from '@prisma/client';

type CombinedExpense = expenses & expense_splits;

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

export default { getMyExpenses };
