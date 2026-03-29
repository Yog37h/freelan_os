# FreelancerOS

A full-stack SaaS platform for freelancers to manage projects, clients, timelines, payments, approvals, and WhatsApp communication — all from a single dashboard.

## Tech Stack

| Layer        | Technology                                                        |
| ------------ | ----------------------------------------------------------------- |
| **Frontend** | Vite 8, React 19, TanStack Router, Tailwind CSS v4, Zustand, Framer Motion |
| **Backend**  | Hono v4 on Node.js, JWT Auth, Zod, Google OAuth                  |
| **Database** | Drizzle ORM → Neon Postgres                                      |
| **AI**       | OpenRouter (timeline generation)                                  |
| **Messaging**| AiSensy WhatsApp API                                             |
| **Monorepo** | pnpm workspaces + Turborepo                                      |

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 10

## Getting Started

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   Copy `.env.example` to `.env.local` and fill in your credentials:
   - `DATABASE_URL` — Neon Postgres connection string
   - `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` — JWT signing keys (min 32 chars each, must differ)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
   - `FRONTEND_URL` — Frontend origin (e.g., `http://localhost:5173`)
   - `VITE_API_URL` — Backend API origin (e.g., `http://localhost:3000`)

3. **Run database migrations**
   ```bash
   pnpm db:migrate
   ```

4. **Start development servers**
   ```bash
   pnpm dev
   ```
   This starts both the frontend (`:5173`) and backend (`:3000`) in parallel via Turborepo.

## Project Structure

```
freelanapp/
├── frontend/           # Vite + React 19 SPA
├── backend/            # Hono API server
├── packages/
│   ├── db/             # Drizzle ORM schema & migrations
│   ├── types/          # Shared TypeScript types
│   └── validators/     # Shared Zod validators
├── scripts/            # Utility scripts
├── docs/               # Smoke test documentation
├── turbo.json          # Turborepo pipeline config
└── pnpm-workspace.yaml # Workspace definition
```

## Scripts

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `pnpm dev`          | Start all dev servers in parallel          |
| `pnpm build`        | Type-check and build all packages          |
| `pnpm lint`         | Run ESLint across all workspaces           |
| `pnpm typecheck`    | Run `tsc --noEmit` across all workspaces   |
| `pnpm db:generate`  | Generate Drizzle migration files           |
| `pnpm db:migrate`   | Apply database migrations                  |

## License

Private — All rights reserved.
