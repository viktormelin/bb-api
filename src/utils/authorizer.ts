import { Authorizer } from '@authorizerdev/authorizer-js';

export const authRef = new Authorizer({
  authorizerURL: 'https://auth.billbuddies.app',
  redirectURL: 'https://billbuddies.app/dashboard',
  clientID: '2df42098-a689-4c65-97db-74ed796e5beb',
});
