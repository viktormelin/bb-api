import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { logger } from '../../utils/logger';
import {
  authRef,
  getBearerToken,
  headersFromToken,
} from '../../utils/authorizer';

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

    return res.status(200);
  } catch (error) {
    logger.error(error);
    return res.status(403).json({ error: 'Invalid JWT token' });
  }
};

const getSelf = expressAsyncHandler(async (req: Request, res: Response) => {
  const { data, errors } = await authRef.getProfile(headersFromToken(req));

  if (errors.length) throw new Error(errors[0].message);

  res.json(data).status(200);
});

export default {
  validateUser,
  getSelf,
};
