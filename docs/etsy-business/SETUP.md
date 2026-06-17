# Etsy AI Business Platform - Setup Guide

## Overview

A production-ready Next.js 14 platform for managing an AI-powered Etsy digital product business. Features include product management, AI-generated SEO, content creation, analytics, market research, and automation.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 + Anthropic Claude
- **Charts**: Recharts
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Language**: TypeScript

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- OpenAI API key (optional - for AI features)
- Anthropic API key (optional - for AI features)

## Quick Start

### 1. Install Dependencies

```bash
cd src/etsy-business
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Required for auth and data persistence
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional - enables AI generation features
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-claude-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase Database

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the schema from `lib/schema.sql`
4. Enable Row Level Security (already included in schema)

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/etsy-business/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with sidebar
│   ├── page.tsx            # Dashboard (redirects to /dashboard)
│   ├── dashboard/          # Main dashboard
│   ├── products/           # Product management
│   ├── seo/                # SEO optimizer
│   ├── content/            # Content creator
│   ├── analytics/          # Analytics & reporting
│   ├── research/           # Market research
│   ├── bundles/            # Bundle manager
│   ├── automation/         # Automation center
│   ├── expansion/          # Product expansion
│   └── api/                # API routes
│       ├── generate-product/
│       ├── generate-seo/
│       └── generate-content/
├── components/
│   ├── layout/             # Sidebar, header
│   └── ui/                 # Reusable UI components
└── lib/
    ├── types.ts            # TypeScript interfaces
    ├── mock-data.ts        # Pre-populated sample data
    ├── supabase.ts         # Supabase client
    ├── openai.ts           # OpenAI client
    ├── claude.ts           # Anthropic Claude client
    ├── products.ts         # Product utilities
    ├── seo.ts              # SEO utilities
    ├── analytics.ts        # Analytics helpers
    └── schema.sql          # Database schema
```

## Features

### Dashboard
- Real-time revenue stats (today / weekly / monthly / annual)
- Top performing products
- Revenue trend chart (30 days)
- Quick action buttons

### Product Management
- View all 10 pre-loaded AI business products
- Filter by type, status, category
- Product cards with revenue, sales, conversion metrics
- AI-powered product generator
- Edit product details

### SEO Optimizer
- AI-generated Etsy titles (140 char limit enforced)
- Tag optimization (13 tags, 20 char limit)
- Full listing description generator
- SEO score with recommendations
- Keyword research by niche

### Content Creator
- Pinterest pin copy + image prompts
- Blog post outlines
- Email sequences
- Social media captions
- Batch generation for multiple platforms

### Analytics
- 30-day revenue chart
- Orders, views, favorites trends
- Per-product performance breakdown
- Conversion rate analysis

### Market Research
- Competitor analysis by keyword
- Market size estimates
- Opportunity scoring (high/medium/low)
- Top tags from competitors
- Pricing recommendations

### Bundle Manager
- Create product bundles with discount pricing
- Bundle performance tracking
- Savings calculator

### Automation Center
- Pre-configured automation tasks
- Run automations manually or on schedule
- Status tracking (idle/running/success/error)
- Categories: SEO, content, pricing, research, analytics

### Product Expansion
- AI-suggested product variations (Lite/Pro/Ultimate)
- Niche targeting suggestions
- Revenue potential estimates

## Running Without API Keys

The platform works fully with mock data when no API keys are configured. AI generation endpoints will return a friendly message prompting you to add keys. All other features (dashboard, analytics, product management, etc.) work with the pre-populated mock data.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables in Vercel dashboard (use `vercel.json` as reference)
4. Deploy

```bash
# Or deploy via CLI
npm i -g vercel
vercel --prod
```

### Environment Variables for Production

Set these in your Vercel/hosting dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## Mock Data Overview

The platform ships with 10 pre-populated products:

| # | Product | Type | Price | Revenue |
|---|---------|------|-------|---------|
| 1 | AI Insurance Agent Toolkit | Prompt Pack | $27 | $4,320 |
| 2 | AI Agency-in-a-Box | Bundle | $97 | $12,620 |
| 3 | Small Business AI Automation Bundle | PDF | $37 | $7,030 |
| 4 | AI Content Creation System | Prompt Pack | $29 | $5,510 |
| 5 | AI Recruiting & Hiring Toolkit | Spreadsheet | $47 | $6,580 |
| 6 | AI Fitness Coach Business Pack | Bundle | $67 | $8,710 |
| 7 | AI Side Hustle Starter Kit | PDF | $19 | $3,610 |
| 8 | Sports Betting Research Toolkit | Spreadsheet | $37 | $5,180 |
| 9 | Notion AI Business Operating System | Notion | $47 | $9,870 |
| 10 | AI Business Growth Vault | Bundle | $197 | $18,230 |

**Total mock revenue: $81,660**

## Support

- GitHub: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
