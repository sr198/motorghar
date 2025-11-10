import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string().datetime(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['admin', 'user']),
  }),
});

export const JwtPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  iat: z.number(),
  exp: z.number(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;