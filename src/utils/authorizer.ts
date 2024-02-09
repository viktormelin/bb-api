import { Authorizer } from '@authorizerdev/authorizer-js';
import { Request } from 'express';
import prismaClient from './prisma';
import { logger } from './logger';

export const authRef = new Authorizer({
  authorizerURL: process.env.AUTH_URL || '',
  redirectURL: process.env.AUTH_REDIRECT_URL || '',
  clientID: process.env.AUTH_CLIENTID || '',
});

export const headersFromToken = (req: Request) => {
  const headers: Record<string, string> = {
    Authorization: req.headers.authorization || '',
  };
  return headers;
};

export const getBearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const splitHeader = authHeader.split(' ');
  return splitHeader[1];
};

export const isPartOfGroup = async (userId: string, groupId: string) => {
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

    if (
      !userGroups?.group_users.some((group: any) => group.groupsId === groupId)
    )
      return false;

    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};
