# ruflo-tiktok-affiliate

Autonomous TikTok Shop affiliate marketing system — product discovery, content strategy, AI-generated scripts, performance tracking, and full campaign orchestration.

## Overview

Five specialized agents collaborate in an autonomous loop to identify high-converting TikTok Shop products, plan and generate content, publish affiliate links, and continuously optimize based on performance data. The orchestrator agent runs a closed feedback loop: discover → strategize → create → publish → analyze → optimize.

## Installation

```bash
claude --plugin-dir plugins/ruflo-tiktok-affiliate
```

## Agents

| Agent | Model | Role |
|-------|-------|------|
| `product-scout` | sonnet | Discover trending TikTok Shop products with high affiliate commission potential |
| `content-strategist` | sonnet | Plan hooks, formats, and posting schedules based on trend data |
| `content-creator` | sonnet | Generate video scripts, captions, hooks, and hashtag sets |
| `performance-analyst` | sonnet | Track clicks, conversions, GMV, EPC, and ROI across campaigns |
| `campaign-orchestrator` | opus | Coordinate all four agents in an autonomous end-to-end marketing loop |

## Skills

| Skill | Usage | Description |
|-------|-------|-------------|
| `tiktok-discover` | `/tiktok-discover [--niche beauty] [--limit 20]` | Scan TikTok Shop for trending products and score affiliate potential |
| `tiktok-create` | `/tiktok-create <product-id> [--format hook-story-cta]` | Generate complete TikTok content package for a product |
| `tiktok-track` | `/tiktok-track [--campaign <id>] [--period 7d]` | Pull performance metrics and surface optimization insights |
| `tiktok-campaign` | `/tiktok-campaign <goal> [--budget 500] [--duration 14d]` | Launch and manage a full autonomous affiliate campaign |

## Commands (20 subcommands)

```bash
tiktok discover [--niche <name>] [--limit 20]          # Discover trending products
tiktok score <product-id>                               # Score a product's affiliate potential
tiktok strategy <product-id> [--format short]          # Generate content strategy
tiktok script <product-id> [--style ugc]               # Write a TikTok video script
tiktok caption <product-id>                             # Generate caption + hashtags
tiktok hook <product-id> [--count 5]                   # Generate opening hooks
tiktok track [--campaign <id>] [--period 7d]           # Fetch performance metrics
tiktok optimize <campaign-id>                          # Generate optimization recommendations
tiktok campaign create <goal>                          # Create a new campaign
tiktok campaign status <campaign-id>                   # Show campaign progress
tiktok campaign pause <campaign-id>                    # Pause running campaign
tiktok campaign resume <campaign-id>                   # Resume paused campaign
tiktok products list [--niche <name>]                  # List tracked products
tiktok products add <product-url>                      # Add product to tracking
tiktok products remove <product-id>                    # Remove product from tracking
tiktok trends [--category <name>]                      # Show TikTok trend analysis
tiktok earnings [--period 30d]                         # Summary of affiliate earnings
tiktok leaderboard [--limit 10]                        # Top performing products
tiktok export <campaign-id> [--format csv]             # Export campaign data
tiktok config set <key> <value>                        # Configure plugin settings
```

## Autonomous Campaign Loop

The `campaign-orchestrator` agent runs a self-improving loop:

```
┌─────────────────────────────────────────────────┐
│             Campaign Orchestrator                │
│                                                 │
│  product-scout ──→ content-strategist           │
│       ↑                    ↓                    │
│  performance-analyst ←── content-creator        │
│       ↓                                         │
│  optimize → (loop back to product-scout)        │
└─────────────────────────────────────────────────┘
```

Each iteration:
1. **Discover** — product-scout finds top 10 trending products with commission ≥ 10%
2. **Strategize** — content-strategist selects best format, hooks, and posting time
3. **Create** — content-creator generates script, caption, hooks, and hashtags
4. **Analyze** — performance-analyst evaluates engagement and conversion signals
5. **Optimize** — campaign-orchestrator adjusts product selection and content style

## Key Metrics Tracked

| Metric | Description |
|--------|-------------|
| CTR | Click-through rate from video to product page |
| CVR | Conversion rate (purchase / click) |
| EPC | Earnings per click |
| GMV | Gross merchandise value from affiliate sales |
| ROAS | Return on ad spend (for boosted content) |
| Hook Rate | % of viewers who watch past 3 seconds |
| Share Rate | Shares per 1,000 views |

## Memory Integration

All agents share a `tiktok-affiliate` memory namespace:

```bash
npx @claude-flow/cli@latest memory store --namespace tiktok-affiliate --key "product-PRODUCT_ID" --value "PRODUCT_DATA_JSON"
npx @claude-flow/cli@latest memory search --query "trending beauty products high commission" --namespace tiktok-affiliate
```

## Related Plugins

- **ruflo-autopilot**: Loop scheduling for autonomous campaign iteration
- **ruflo-agentdb**: Persistent storage for product data and content history
- **ruflo-observability**: Metrics dashboards for campaign performance
- **ruflo-market-data**: Market trend data to correlate with TikTok trends
