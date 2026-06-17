# Etsy AI Business Platform - Deployment Guide

## Deploy to Vercel (Recommended)

### Prerequisites
- Vercel account (vercel.com)
- Node.js 20+
- npm 9+

### Step 1: Push to GitHub
```bash
git add src/etsy-business/
git commit -m "Add Etsy AI Business Platform"
git push origin main
```

### Step 2: Import to Vercel
1. Go to vercel.com/new
2. Import your GitHub repository
3. Set root directory to `src/etsy-business`
4. Configure environment variables (see below)

### Step 3: Environment Variables
Add these in Vercel dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_SUPABASE_URL | Your Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Your Supabase anon key |
| SUPABASE_SERVICE_ROLE_KEY | Your Supabase service role key |
| OPENAI_API_KEY | Your OpenAI API key |
| ANTHROPIC_API_KEY | Your Anthropic API key |
| NEXT_PUBLIC_APP_URL | Your Vercel deployment URL |

### Step 4: Deploy
Click "Deploy" in Vercel. Build takes ~2 minutes.

## Supabase Setup

### Create Project
1. Go to supabase.com
2. Create new project
3. Copy project URL and anon key

### Run Schema
1. Go to Supabase SQL Editor
2. Paste contents of `lib/schema.sql`
3. Click "Run"

### Enable Auth (Optional)
1. Supabase → Authentication → Providers
2. Enable Email/Password
3. Configure redirect URLs

## Local Development

```bash
cd src/etsy-business
cp .env.example .env.local
# Add your API keys to .env.local
npm install
npm run dev
# Open http://localhost:3000
```

## API Keys

### OpenAI
1. platform.openai.com → API Keys → Create new key
2. Recommended model: gpt-4-turbo-preview
3. Set spending limits for safety

### Anthropic (Claude)
1. console.anthropic.com → API Keys
2. Recommended model: claude-opus-4-5
3. All generation falls back to mock data if key not set

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase schema deployed
- [ ] RLS policies enabled (included in schema.sql)
- [ ] API keys tested
- [ ] Custom domain configured (optional)
- [ ] Analytics tracking added (optional)

## Scaling

The platform is designed to scale with your business:
- **Database**: Supabase handles millions of rows
- **AI calls**: OpenAI/Anthropic rate limits apply; add retry logic for high volume
- **Storage**: Supabase Storage for product files and mockups
- **CDN**: Vercel Edge Network for fast global delivery
