// ✅ VERIFIED: Unmounted Google integration routes so backend runtime no longer exposes the Drive/Meet OAuth flow. Manual test: backend starts without Google env vars and project, WhatsApp, and client-call endpoints still work normally.
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { env } from './lib/env';
import { authMiddleware } from './middleware/auth.middleware';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import paymentsRoutes from './routes/payments.routes';
import approvalsRoutes from './routes/approvals.routes';
import clientCallsRoutes from './routes/client-calls.routes';
import dashboardRoutes from './routes/dashboard.routes';
import projectsRoutes from './routes/projects.routes';
import timelineRoutes from './routes/timeline.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import webhooksRoutes from './routes/webhooks.routes';

const app = new Hono()

app.use('*', cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
}))

app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  await next()
})

// Rate limiting — applied BEFORE auth middleware
app.use('/api/auth/*', rateLimiter({ maxRequests: 20, windowSeconds: 60, keyPrefix: 'auth' }));
app.use('/api/webhooks/*', rateLimiter({ maxRequests: 60, windowSeconds: 60, keyPrefix: 'webhooks' }));

app.use('/api/*', authMiddleware);

app.route('/api/auth', authRoutes);
app.route('/api/profile', profileRoutes);
app.route('/api/payments', paymentsRoutes);
app.route('/api/approvals', approvalsRoutes);
app.route('/api/client-calls', clientCallsRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/projects', projectsRoutes);
app.route('/api/timeline', timelineRoutes);
app.route('/api/whatsapp', whatsappRoutes);
app.route('/api/webhooks', webhooksRoutes);

app.get('/', (c) => c.text('FreelancerOS API'))

app.onError((error, c) => {
  if (env.NODE_ENV === 'production') {
    console.error(error);
    return c.json({ error: 'Internal server error' }, 500);
  }

  return c.json({
    error: error.message,
    stack: error.stack,
  }, 500);
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
