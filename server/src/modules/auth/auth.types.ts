export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface JwtPayload extends AuthenticatedUser {
  sub: string;
}
