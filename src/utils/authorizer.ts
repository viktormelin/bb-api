import { Authorizer } from '@authorizerdev/authorizer-js';
import { Request } from 'express';

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
