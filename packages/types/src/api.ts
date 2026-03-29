export type ApiEnvelope<T> = {
  data: T | null;
  error: { message: string; details?: unknown } | null;
  meta: Record<string, unknown> | null;
};

export type ApiError = {
  message: string;
  details?: unknown;
};
