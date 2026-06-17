## Quick Start

### Demo Mode (no setup required)
```bash
cd src/etsy-business
npm install
npm run dev
```
Visit http://localhost:3000 — works immediately with mock data, no API keys needed.

### Production Setup
1. Create accounts: [Supabase](https://supabase.com) | [OpenAI](https://platform.openai.com) | [Etsy Developers](https://www.etsy.com/developers)
2. Run the SQL schema: paste `lib/schema.sql` into your Supabase SQL editor
3. Seed the database: `npx tsx scripts/seed.ts`
4. Create your first user: Supabase Dashboard → Authentication → Users → Invite
5. Copy `.env.example` to `.env.local` and fill in your keys
6. `npm run dev` and log in at http://localhost:3000/login

---

# Etsy AI Business Platform — Setup Guide

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

### Required for AI Features
```
OPENAI_API_KEY=sk-...
```

### Required for Database & Auth (optional — app runs in demo mode without these)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # only needed for scripts/seed.ts
```

### Optional — Etsy API Integration
```
ETSY_API_KEY=your_etsy_api_key
ETSY_SHOP_ID=your_shop_id
```

## Authentication

### Demo Mode
Leave the Supabase variables empty. The app runs with mock data and no login is required.

### Production Auth
When Supabase is configured:
- All routes except `/login` and `/api/*` are protected by `middleware.ts`
- Visit `/login` to sign in or create an account
- Create users via the Supabase Dashboard → Authentication → Users → Invite user

### Auth Flow
1. User visits any protected route
2. `middleware.ts` checks for a valid Supabase session
3. If no session found, redirects to `/login`
4. After login, `router.push('/')` sends the user back to the dashboard

## Database Seeding

Once Supabase is configured, seed the products table:

```bash
npx tsx scripts/seed.ts
```

This inserts 10 pre-built digital products with realistic sales data. The script is idempotent — it skips seeding if products already exist.

**Requirements:**
- `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (service role, not anon key)

## Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
```

## Project Structure

```
app/
  login/page.tsx        # Public login page
  (other routes)        # Protected by middleware
lib/
  auth.ts               # Server-side Supabase client + getSession()
  supabase.ts           # Client-side Supabase singleton
  schema.sql            # Database schema (paste into Supabase SQL editor)
  mock-data.ts          # Fallback data for demo mode
middleware.ts           # Route protection (Supabase session check)
scripts/
  seed.ts               # Database seed script (10 products)
```
