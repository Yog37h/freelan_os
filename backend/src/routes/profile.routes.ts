import { Hono } from 'hono';
import { z } from 'zod';
import { requireUser } from '@/auth/requireUser';
import * as profileService from '@/services/profileService';
import { ProfileUpdateSchema } from '@/validators/profile';
import { fail, ok, unauthorized, validationError } from '@/http/response';

const profileRoutes = new Hono();

profileRoutes.get('/', async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);
  const profile = await profileService.getMyProfile(user.sub);
  return ok(c, profile);
});

profileRoutes.patch('/', async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);
  const body = await c.req.json().catch(() => null);
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  try {
    const profile = await profileService.updateMyProfile(user.sub, parsed.data);
    return ok(c, profile);
  } catch (error) {
    return fail(c, error instanceof Error ? error.message : 'Failed to update profile', 400);
  }
});

profileRoutes.post('/username-check', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z.object({ username: z.string().min(3) }).safeParse(body);
  if (!parsed.success) {
    return validationError(c, parsed.error.format());
  }

  const available = await profileService.checkUsername(parsed.data.username);
  return ok(c, { available });
});

export default profileRoutes;
