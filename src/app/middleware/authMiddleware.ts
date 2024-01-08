/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { NextFunction, Request, Response } from 'express';
import { authRef } from '../../utils/authorizer';
import { logger } from '../../utils/logger';

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(403).json({ error: 'Authorization not found' });

  const splitHeader = authHeader.split(' ');
  if (splitHeader.length != 2)
    return res.status(403).json({ error: 'Invalid auth header' });

  if (splitHeader[0].toLowerCase() != 'bearer')
    return res.status(403).json({ error: 'Bearer token not found' });

  const token = splitHeader[1];

  try {
    const { data, errors } = await authRef.validateJWTToken({
      token,
      token_type: 'id_token', // This can be access_token, refresh_token
      // roles: [user] // specify roles that you want to validate jwt for, by default it will just verify jwt.
    });

    if (errors.length) throw new Error(errors[0].message);

    if (!data?.is_valid)
      return res.status(403).json({ error: 'Invalid JWT token' });

    // req.user = data?.claims;
  } catch (error) {
    logger.error(error);
    return res.status(403).json({ error: 'Invalid JWT token' });
  }

  next();
};

export default authMiddleware;
