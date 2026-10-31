import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: PaginationMeta,
  statusCode = 200
) {
  const payload: { data: T; meta?: PaginationMeta } = { data };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

export function sendCreated<T>(res: Response, data: T) {
  return sendSuccess(res, data, undefined, 201);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown[]
) {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
