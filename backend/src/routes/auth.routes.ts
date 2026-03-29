import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { db, profiles, users } from '@freelancer-os/db';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { env } from '@/lib/env';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/jwt';

const authRoutes = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).optional(),
});

function sanitizeUser(user: typeof users.$inferSelect, profile?: typeof profiles.$inferSelect | null) {
  return {
    id: user.id,
    email: user.email,
    name: profile?.fullName || user.name || user.email.split('@')[0],
    avatar: profile?.avatarUrl || user.avatar || null,
    role: user.role || 'freelancer',
  };
}

async function issueTokens(user: typeof users.$inferSelect) {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role || 'freelancer',
  });
  const refreshToken = signRefreshToken({ sub: user.id });
  const refreshHash = bcrypt.hashSync(refreshToken, 10);

  await db
    .update(users)
    .set({
      refreshTokenHash: refreshHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return { accessToken, refreshToken };
}

function setRefreshCookie(c: Parameters<typeof setCookie>[0], refreshToken: string) {
  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}

function getGoogleAuthConfig() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return null;
  }

  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

authRoutes.get('/google', (c) => {
  const googleAuth = getGoogleAuthConfig();
  if (!googleAuth) {
    return c.json({ error: 'Google sign-in is not configured' }, 503);
  }

  const redirectUri = `${env.FRONTEND_URL}/auth/callback`;
  const callbackUri = `${env.FRONTEND_URL.replace(/5173$/, '3000')}`;
  const backendCallback = `${callbackUri}/api/auth/google/callback`;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', googleAuth.clientId);
  url.searchParams.set('redirect_uri', backendCallback);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'profile email');
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('state', redirectUri);
  return c.redirect(url.toString());
});

authRoutes.get('/google/callback', async (c) => {
  const googleAuth = getGoogleAuthConfig();
  if (!googleAuth) {
    return c.json({ error: 'Google sign-in is not configured' }, 503);
  }

  const code = c.req.query('code');
  if (!code) {
    return c.json({ error: 'No code' }, 400);
  }

  const backendOrigin = c.req.url.split('/api/auth/google/callback')[0];
  const redirectUri = `${backendOrigin}/api/auth/google/callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: googleAuth.clientId,
      client_secret: googleAuth.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    return c.json({ error: 'Auth failed' }, 400);
  }

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const profileInfo = await profileRes.json();
  const email = profileInfo.email as string;
  const name = (profileInfo.name as string) || email.split('@')[0];
  const avatar = (profileInfo.picture as string) || null;
  const googleId = (profileInfo.id as string) || null;

  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email,
        name,
        avatar,
        googleId,
        plan: 'FREE',
        role: 'freelancer',
      })
      .returning();

    await db.insert(profiles).values({
      id: user.id,
      email,
      fullName: name,
      avatarUrl: avatar,
      onboardingCompleted: false,
    });
  } else {
    await db
      .update(users)
      .set({
        name,
        avatar,
        googleId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  setRefreshCookie(c, refreshToken);

  return c.redirect(`${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(accessToken)}`);
});

authRoutes.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [user] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash,
      plan: 'FREE',
      role: 'freelancer',
    })
    .returning();

  await db.insert(profiles).values({
    id: user.id,
    email: user.email,
    username: parsed.data.username,
    onboardingCompleted: false,
  });

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  });
  const { accessToken, refreshToken } = await issueTokens(user);
  setRefreshCookie(c, refreshToken);

  return c.json({ accessToken, user: sanitizeUser(user, profile) }, 201);
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (!user?.passwordHash) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  });
  const { accessToken, refreshToken } = await issueTokens(user);
  setRefreshCookie(c, refreshToken);

  return c.json({ accessToken, user: sanitizeUser(user, profile) });
});

authRoutes.post('/refresh', async (c) => {
  const authHeader = c.req.header('Authorization');
  const body = await c.req.json().catch(() => null);
  const refreshToken = getCookie(c, 'refresh_token');

  if (authHeader || (body && (body.refreshToken || body.refresh_token))) {
    return c.json({ error: 'Token sent incorrectly' }, 401);
  }

  if (!refreshToken) {
    return c.json({ error: 'No refresh token' }, 401);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.sub),
    });

    if (!user?.refreshTokenHash) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const isValid = bcrypt.compareSync(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      await db
        .update(users)
        .set({ refreshTokenHash: null, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      return c.json({ error: 'Invalid token' }, 401);
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
    });
    const { accessToken, refreshToken: nextRefreshToken } = await issueTokens(user);
    setRefreshCookie(c, nextRefreshToken);

    return c.json({ accessToken, user: sanitizeUser(user, profile) });
  } catch {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }
});

authRoutes.post('/logout', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token');
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      await db
        .update(users)
        .set({ refreshTokenHash: null, updatedAt: new Date() })
        .where(eq(users.id, decoded.sub));
    } catch {
      // Ignore invalid refresh token on logout.
    }
  }

  deleteCookie(c, 'refresh_token', { path: '/' });
  return c.text('Logged out', 200);
});

export default authRoutes;
