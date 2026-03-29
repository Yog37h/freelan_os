import type { Context } from 'hono';

export type AuthUser = {
  sub: string;
  email?: string;
  role?: string;
};

export function requireUser(c: Context) {
  const user = c.get('user') as AuthUser | undefined;

  if (!user) {
    return null;
  }

  return user;
}
