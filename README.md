# Next.js Starter Kit

A starter kit for building Next.js applications with Prisma, PostgreSQL, Shadcn UI, and Clerk authentication. Uses the App Router and is set up for server-side data fetching and modern React patterns.

## Tech Stack

- **Next.js** 16 (App Router)
- **React** 19
- **Prisma** 7 with PostgreSQL (via `@prisma/adapter-pg` and `pg`)
- **Clerk** for authentication
- **Shadcn UI** (Radix UI, Tailwind CSS 4, Lucide icons)
- **TypeScript** 5

## Prerequisites

- Node.js 18+
- PostgreSQL database
- [Clerk](https://clerk.com) account (for auth and webhooks)

## Getting Started

1. **Clone the repository and install dependencies**

   ```bash
   git clone <repository-url>
   cd nextjstarterkit
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

   Required variables:

   | Variable | Description |
   |----------|-------------|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (Dashboard) |
   | `CLERK_SECRET_KEY` | Clerk secret key (Dashboard) |
   | `CLERK_WEBHOOK_SIGNING_SECRET` | Signing secret for the Clerk webhook endpoint |
   | `DB_URL` or `DATABASE_URL` | PostgreSQL connection string |

3. **Set up the database**

   Ensure your Prisma schema `datasource` has a `url` (or use `DB_URL`/`DATABASE_URL` in env). Then run:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

   For migrations instead of push:

   ```bash
   npx prisma migrate dev
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

- `app/` – App Router pages, layout, and global styles
- `app/api/webhooks/` – Clerk webhook handler (user sync and delete)
- `lib/db.ts` – Prisma client (PostgreSQL adapter, singleton in dev)
- `lib/utils.ts` – `cn()` helper for class names (Shadcn)
- `prisma/schema.prisma` – Database schema
- `components.json` – Shadcn UI configuration (aliases, style, Tailwind)

## Database

The Prisma schema includes a `User` model synced from Clerk:

- `id` (UUID), `clerkId` (unique), `email` (unique), `name`, `createdAt`, `updatedAt`

The webhook at `POST /api/webhooks` keeps this table in sync with Clerk:

- **user.created / user.updated** – Upserts a user by `clerkId` (email and name from Clerk).
- **user.deleted** – Deletes the user and any related `Image` and `Credit` records in a transaction. If you do not have `Image` or `Credit` models yet, add them to the schema or simplify the webhook delete logic.

Configure the Clerk webhook in the Clerk Dashboard to point to:

`https://your-domain.com/api/webhooks`

and use the same signing secret as `CLERK_WEBHOOK_SIGNING_SECRET`.

## Available Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx prisma generate` | Regenerate Prisma Client (also runs on `npm install`) |

## Shadcn UI

The project uses Shadcn with the **new-york** style, **neutral** base color, and CSS variables. Components live under `@/components/ui`, utilities under `@/lib/utils`. To add new components:

```bash
npx shadcn@latest add <component-name>
```

## Layout and Styling

- Root layout uses Geist Sans and Geist Mono from `next/font`.
- Global styles and Tailwind are in `app/globals.css`; use Tailwind variables for theming rather than hardcoded colors.
