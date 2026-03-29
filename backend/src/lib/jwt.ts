import jwt from 'jsonwebtoken';
import { env } from './env';

export type TokenPayload = {
    sub: string;
    email?: string;
    role?: string;
};

export const signAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

export const signRefreshToken = (payload: { sub: string }): string => {
    return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { sub: string } => {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as { sub: string };
};
