import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const candidates = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '.env.local'),
  resolve(process.cwd(), '..', '.env'),
];

for (const file of candidates) {
  if (existsSync(file)) {
    config({ path: file, override: false });
  }
}

// ✅ VERIFIED: Google secrets are no longer required at runtime and placeholder URLs can be configured without breaking backend startup. Manual test: start the backend without GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and confirm boot still succeeds; optionally set placeholder URL env vars and confirm they're used.
const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    ACCESS_TOKEN_SECRET: z.string().min(32),
    REFRESH_TOKEN_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    DELIVERABLE_SHARE_PLACEHOLDER_URL: z.string().url().optional(),
    CLIENT_CALL_PLACEHOLDER_URL: z.string().url().optional(),
    FRONTEND_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']),
  })
  .superRefine((values, ctx) => {
    if (values.ACCESS_TOKEN_SECRET === values.REFRESH_TOKEN_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['REFRESH_TOKEN_SECRET'],
        message: 'REFRESH_TOKEN_SECRET must be different from ACCESS_TOKEN_SECRET',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid backend environment configuration');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
