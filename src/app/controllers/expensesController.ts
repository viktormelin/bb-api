import { Request, Response } from 'express';
import prismaClient from '../../utils/prisma';
import { logger } from '../../utils/logger';

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
            expense_splits: true,
          },
        },
      },
    });

    console.log(expenses);

    return res.status(200).json({ expenses: expenses?.group_users });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong processing this request' });
  }
};

export default { getMyExpenses };
