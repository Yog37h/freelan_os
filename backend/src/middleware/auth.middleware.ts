// ✅ VERIFIED: Removed Google callback auth exemption because Google integration routes are no longer part of runtime flow. Manual test: backend auth still permits /api/auth and /api/webhooks while protecting the rest of /api.
import { Context, Next } from 'hono';
import { verifyAccessToken } from '../lib/jwt';

export const authMiddleware = async (c: Context, next: Next) => {
    // Skip checking /api/auth routes
    const path = c.req.path;
    if (
        path.startsWith('/api/auth/') ||
        path.startsWith('/api/webhooks/')
    ) {
        await next();
        return;
    }

    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const decoded = verifyAccessToken(token);
        c.set('user', decoded);
        await next();
    } catch (error) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
};
