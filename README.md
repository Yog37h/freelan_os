# FreelancerOS

FreelanceOS is a monorepo app for managing freelance projects, timelines, deliverables, payments, approvals, and WhatsApp-based client communication from one dashboard.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, TanStack Router, Tailwind CSS v4, Zustand, Framer Motion |
| Backend | Hono on Node.js, JWT auth, Zod |
| Database | Postgres + Drizzle ORM |
| AI | OpenRouter |
| Messaging | YCloud WhatsApp API |
| Monorepo | pnpm workspaces + Turborepo |

## Prerequisites

- Node.js 18 or newer
- pnpm 10 or newer
- A Postgres database

## Clone and Run

1. Clone the repository:

```bash
git clone https://github.com/Yog37h/freelan_os.git
cd freelan_os
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a root `.env` file:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000

DATABASE_URL=your_postgres_connection_string
ACCESS_TOKEN_SECRET=put_a_long_random_string_here_min_32_chars
REFRESH_TOKEN_SECRET=put_a_different_long_random_string_here_min_32_chars

YCLOUD_API_KEY=your_ycloud_api_key
YCLOUD_API_URL=https://api.ycloud.com/v2
YCLOUD_WHATSAPP_FROM=your_registered_ycloud_whatsapp_number
YCLOUD_WEBHOOK_SECRET=your_ycloud_webhook_secret

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=arcee-ai/trinity-large-preview:free

DELIVERABLE_SHARE_PLACEHOLDER_URL=http://localhost:5173
CLIENT_CALL_PLACEHOLDER_URL=http://localhost:5173
```

4. Run database migrations:

```bash
pnpm db:migrate
```

5. Start the app:

```bash
pnpm dev
```

6. Open the app:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## What Each Env Variable Does

### Required for backend startup

- `DATABASE_URL`
  Your Postgres connection string.
- `ACCESS_TOKEN_SECRET`
  JWT access token secret. Must be at least 32 characters.
- `REFRESH_TOKEN_SECRET`
  JWT refresh token secret. Must be at least 32 characters and different from `ACCESS_TOKEN_SECRET`.
- `FRONTEND_URL`
  Frontend origin used for CORS.
- `NODE_ENV`
  Usually `development` locally.

### Required for the frontend to call the backend

- `VITE_API_URL`
  Backend base URL. For local dev use `http://localhost:3000`.

### Required for real WhatsApp messaging

- `YCLOUD_API_KEY`
  YCloud API key.
- `YCLOUD_API_URL`
  YCloud base URL. Default is `https://api.ycloud.com/v2`.
- `YCLOUD_WHATSAPP_FROM`
  Your connected YCloud WhatsApp number.
- `YCLOUD_WEBHOOK_SECRET`
  Secret used to validate YCloud webhooks.

### Required for AI timeline/project generation

- `OPENROUTER_API_KEY`
  OpenRouter API key.
- `OPENROUTER_MODEL`
  Optional model override. A default exists, but setting it explicitly is safer.

### Optional placeholder links

- `DELIVERABLE_SHARE_PLACEHOLDER_URL`
  Fallback link used when sending deliverable share messages.
- `CLIENT_CALL_PLACEHOLDER_URL`
  Fallback link used when sending scheduled client call messages.

If these are omitted, the backend falls back to `FRONTEND_URL`.

## Optional Google Sign-In

Google Drive and Google Meet are not required for runtime anymore.

Google login is optional. If you want Google sign-in, also add:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

If these are not provided, normal app runtime still works, but Google auth login will be unavailable.

## Common Local Setup Notes

- Keep all environment variables in the root `.env` file.
- Do not commit your real `.env` file.
- Make sure the database exists before running `pnpm db:migrate`.
- If WhatsApp env vars are missing, the app can still boot, but real YCloud message sends will fail.
- If `OPENROUTER_API_KEY` is missing, AI-generated timeline features will fail.

## Useful Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start frontend and backend in parallel |
| `pnpm build` | Build all workspaces |
| `pnpm lint` | Run linting across the monorepo |
| `pnpm typecheck` | Run TypeScript checks across the monorepo |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply Drizzle migrations |

## Project Structure

```text
freelan_os/
├── backend/            # Hono API server
├── frontend/           # Vite React app
├── packages/
│   ├── db/             # Drizzle schema and migrations
│   ├── types/          # Shared TypeScript types
│   └── validators/     # Shared validation schemas
├── docs/               # Project docs and smoke notes
├── scripts/            # Utility scripts
├── turbo.json
├── pnpm-workspace.yaml
└── .env                # Local runtime configuration
```
