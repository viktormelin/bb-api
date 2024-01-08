import { Authorizer } from '@authorizerdev/authorizer-js';
import { Request } from 'express';

export const authRef = new Authorizer({
  authorizerURL: 'https://auth.billbuddies.app',
  redirectURL: 'https://billbuddies.app/dashboard',
  clientID: '2df42098-a689-4c65-97db-74ed796e5beb',
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
