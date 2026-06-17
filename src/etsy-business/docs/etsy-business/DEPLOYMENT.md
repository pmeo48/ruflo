# Deployment Guide — Etsy AI Business Platform

## Prerequisites

- Node.js 18+
- Vercel account
- Supabase account (optional, for production data)
- OpenAI API key (optional, for AI generation)

## Local Development

```bash
cd src/etsy-business
cp .env.example .env.local
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Set these in Vercel or your `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `OPENAI_API_KEY` | No | OpenAI key for AI generation |
| `ANTHROPIC_API_KEY` | No | Claude key for AI generation |

The app works with mock data when no API keys are provided.

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel --cwd src/etsy-business
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Import repo in [vercel.com/new](https://vercel.com/new)
3. Set root directory to `src/etsy-business`
4. Add environment variables
5. Deploy

### Option 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo)

## Build Configuration

The `vercel.json` at the project root handles routing. Build command: `npm run build`. Output: `.next`.

## Production Checklist

- [ ] Set all required environment variables in Vercel
- [ ] Configure Supabase database (run `lib/schema.sql`)
- [ ] Add custom domain in Vercel settings
- [ ] Enable Vercel Analytics
- [ ] Test all AI generation endpoints
- [ ] Verify SEO meta tags

## Troubleshooting

**Build fails:** Run `npm install --legacy-peer-deps` locally first.

**AI generation returns errors:** Check API keys in environment variables.

**Charts not rendering:** Recharts requires client-side rendering — ensure `'use client'` directive is present.
