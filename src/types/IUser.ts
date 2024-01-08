export interface JWTUser {
  allowed_roles: string[];
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  login_method: string;
  nonce: string;
  roles: string[];
  scope: string[];
  sub: string;
  token_type: string;
}
