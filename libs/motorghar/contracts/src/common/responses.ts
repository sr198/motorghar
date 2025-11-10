import { z } from 'zod';

export const MetaSchema = z.object({
  timestamp: z.string().datetime(),
  requestId: z.string().uuid(),
});

export const PaginationMetaSchema = MetaSchema.extend({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: MetaSchema,
  });

export const ListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });

export const ErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(ErrorDetailSchema).optional(),
  }),
  meta: MetaSchema,
});

export type SuccessResponse<T> = {
  data: T;
  meta: z.infer<typeof MetaSchema>;
};

export type ListResponse<T> = {
  data: T[];
  meta: z.infer<typeof PaginationMetaSchema>;
};

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;