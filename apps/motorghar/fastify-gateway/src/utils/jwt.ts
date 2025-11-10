import jwt from 'jsonwebtoken';
import { JwtPayload } from '@motorghar/contracts';
import { config } from '../config/index.js';

export function signToken(payload: {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded as JwtPayload; 
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}