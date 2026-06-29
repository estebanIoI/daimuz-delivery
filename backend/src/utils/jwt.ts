import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthPayload } from '../types';

const SECRET: string = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as string | number;

export function signToken(payload: AuthPayload): string {
  const options: SignOptions = { expiresIn: EXPIRES_IN as any };
  return jwt.sign(payload as object, SECRET, options);
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, SECRET) as AuthPayload;
}
