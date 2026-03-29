import type { Context } from 'hono';

type Envelope<T = unknown> = {
  data: T | null;
  error: { message: string; details?: unknown } | null;
  meta: Record<string, unknown> | null;
};

function envelope<T>(
  data: T | null,
  error: Envelope['error'],
  meta: Envelope['meta'] = null,
): Envelope<T> {
  return { data, error, meta };
}

export function ok<T>(c: Context, data: T, meta: Record<string, unknown> | null = null, status = 200) {
  return c.json(envelope(data, null, meta), { status: status as 200 });
}

export function fail(c: Context, message: string, status = 400, details?: unknown) {
  return c.json(envelope(null, { message, details }), { status: status as 400 });
}

export function notFound(c: Context, message = 'Not found') {
  return c.json(envelope(null, { message }), { status: 404 });
}

export function unauthorized(c: Context, message = 'Unauthorized') {
  return c.json(envelope(null, { message }), { status: 401 });
}

export function validationError(c: Context, details: unknown) {
  return c.json(envelope(null, { message: 'Validation failed', details }), { status: 422 });
}
