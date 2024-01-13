import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { authRef, getBearerToken } from '../../utils/authorizer';
import prismaClient from '../../utils/prisma';

const validateUser = async (req: Request, res: Response) => {
  const authToken = getBearerToken(req);

  if (!authToken)
    return res.status(403).json({ error: 'Authorization not found' });

  try {
    const { data, errors } = await authRef.validateJWTToken({
      token: authToken,
      token_type: 'id_token', // This can be access_token, refresh_token
      // roles: [user] // specify roles that you want to validate jwt for, by default it will just verify jwt.
    });

    if (errors.length) throw new Error(errors[0].message);

    if (!data?.is_valid)
      return res.status(403).json({ error: 'Invalid JWT token' });

    return res.status(200).send();
  } catch (error) {
    logger.error(error);
    return res.status(403).json({ error });
  }
};

const getProfile = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) throw new Error('Failed to find id (sub) on user');

  try {
    const dbUser = await prismaClient.authorizer_users.findUnique({
      where: { id: userId },
      include: {
        friends: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        group_users: true,
      },
    });

    const user = {
      ...dbUser,
      email_verified_at: Number(dbUser?.email_verified_at),
      updated_at: Number(dbUser?.updated_at),
      created_at: Number(dbUser?.created_at),
    };

    return res.json({ user }).status(200);
  } catch (error) {
    logger.error(error);
    return res.status(403).json({ error });
  }
};

export default {
  validateUser,
  getProfile,
};
