# ruflo-tiktok-affiliate — Architecture

## System Overview

The TikTok Shop affiliate marketing system is a five-agent autonomous loop built on the ruflo platform. Agents communicate via SendMessage, share state through the AgentDB memory system, and continuously self-improve via neural pattern training.

## Agent Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    campaign-orchestrator (opus)                   │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────┐   │
│  │product-scout│───▶│content-strategist│───▶│content-creator │   │
│  └─────────────┘    └──────────────────┘    └────────────────┘   │
│         ▲                                          │             │
│         │                                          ▼             │
│  ┌──────┴──────────────────────────────────────────────────┐     │
│  │                  performance-analyst                     │     │
│  │  (feeds back to orchestrator → triggers product-scout)  │     │
│  └──────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

## Memory Namespaces

| Namespace | Owner | Contents |
|-----------|-------|----------|
| `tiktok-affiliate` | product-scout | Product records, scores, trend data |
| `tiktok-strategy` | content-strategist | Content strategy plans per product |
| `tiktok-content` | content-creator | Generated scripts, captions, content packages |
| `tiktok-performance` | performance-analyst | KPI reports, A/B results, trend analysis |
| `tiktok-campaigns` | campaign-orchestrator | Campaign configs, iteration logs, state |
| `tiktok-benchmarks` | performance-analyst | Niche EPC/CTR benchmarks for scoring context |
| `tiktok-patterns` | all agents | Neural patterns from successful campaigns |
| `tiktok-config` | campaign-orchestrator | Plugin configuration settings |

## Agent Communication Flow

```
Iteration N start:
  orchestrator ──SendMessage──▶ product-scout: "Discover top 10 products in [niches]"
  product-scout ──SendMessage──▶ content-strategist: "Here are [N] hot products: [data]"
  content-strategist ──SendMessage──▶ content-creator: "Strategies ready: [strategy plans]"
  content-creator ──SendMessage──▶ performance-analyst: "Track content IDs: [IDs]"
  content-creator ──SendMessage──▶ campaign-orchestrator: "Content ready: [IDs]"
  [48 hours pass]
  performance-analyst ──SendMessage──▶ campaign-orchestrator: "Performance report: [data]"
  campaign-orchestrator evaluates report → schedules Iteration N+1
```

## Data Schemas

### Product Record
```json
{
  "product_id": "string",
  "name": "string",
  "niche": "beauty|fashion|home|tech|fitness|food|other",
  "price_usd": 0.00,
  "commission_rate": 0.00,
  "trend_velocity": 0.00,
  "review_score": 0.00,
  "affiliate_count": 0,
  "potential_score": 0.00,
  "tier": "hot|warm|cold",
  "affiliate_link": "string",
  "discovered_at": "ISO8601"
}
```

### Content Package
```json
{
  "content_id": "string",
  "product_id": "string",
  "variant": "A|B|C",
  "format": "string",
  "hook": "string",
  "script": { "...5 scene objects..." },
  "caption": "string",
  "hashtags": [],
  "b_roll_list": [],
  "affiliate_link_placement": "bio|comment|sticker"
}
```

### Performance Report
```json
{
  "report_id": "string",
  "campaign_id": "string",
  "period": "string",
  "summary": { "...KPI totals..." },
  "products": [ "...per-product KPIs..." ],
  "content_variants": [ "...A/B results..." ],
  "insights": [],
  "recommendations": []
}
```

## Neural Learning Loop

Each agent trains on successful outcomes using the ruflo neural system:

1. **post-task hooks** fire after each agent completes a task
2. **Pattern storage** in `tiktok-patterns` namespace captures what worked
3. **HNSW indexing** enables fast semantic recall of similar past situations
4. **ReasoningBank** tracks trajectory: which hook styles → high CTR, which products → high EPC

The system improves with each iteration — product scoring becomes more accurate, hook suggestions align with what worked historically, and the orchestrator's niche allocation improves based on EPC trends.

## Autonomy Model

The campaign runs without human intervention:

- The campaign-orchestrator schedules its own iteration wake-ups
- Agents act on incoming SendMessages without polling
- Quality gates prevent drift: if a discovery run finds < 5 products, criteria auto-loosen
- Abort conditions exist for unrecoverable underperformance (EPC < $0.10 after 4 iterations)

Human touchpoints:
- Campaign launch (`/tiktok-campaign`)
- Optional pause/resume (`tiktok campaign pause/resume`)
- Performance review (`/tiktok-track`)
- Final earnings report (`tiktok earnings`)
