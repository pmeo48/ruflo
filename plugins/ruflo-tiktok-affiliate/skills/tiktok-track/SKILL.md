---
name: tiktok-track
description: Pull affiliate campaign performance metrics and surface optimization insights
argument-hint: "[--campaign <id>] [--period 7d|14d|30d] [--product <id>]"
allowed-tools: Bash mcp__claude-flow__memory_store mcp__claude-flow__memory_search mcp__claude-flow__memory_retrieve mcp__claude-flow__embeddings_generate mcp__claude-flow__ruvllm_hnsw_route
---

# TikTok Track

Retrieve and analyze TikTok affiliate campaign performance — views, hook rates, CTR, CVR, EPC, and GMV — with automated optimization recommendations.

## When to use

When you want to check how a campaign or specific product is performing, evaluate A/B test results, or get actionable recommendations for improving affiliate ROI.

## Parameters

- `--campaign <id>` — campaign ID to analyze (default: most recent active campaign)
- `--period <days>` — lookback window: `24h`, `48h`, `7d`, `14d`, `30d` (default: `7d`)
- `--product <id>` — analyze a single product instead of the full campaign
- `--ab-eval` — force A/B test evaluation now (requires ≥100 clicks per variant)
- `--export <format>` — export report as `json` or `csv`

## Steps

1. **Retrieve campaign config** — fetch from `tiktok-campaigns` namespace

2. **Retrieve performance data** — search `tiktok-performance` namespace for reports matching campaign ID and period

3. **Compute KPIs** for each product:
   - Hook Rate = viewers past 3s / impressions
   - CTR = clicks / views
   - CVR = conversions / clicks
   - EPC = commissions / clicks
   - GMV = total purchase value
   - Engagement Rate = (likes + comments + shares) / views

4. **Run A/B evaluation** — if two variants exist with ≥100 clicks each:
   - Compare CTR and hook rate
   - Declare winner if delta ≥ 20%
   - Mark loser for pausing

5. **Apply decision rules** for each product:
   - EPC ≥ $1.00 AND CVR ≥ 3% → `top` (scale)
   - EPC $0.30–$1.00 AND CVR 1–3% → `average` (maintain)
   - EPC < $0.30 after 7d AND ≥300 clicks → `pause`
   - Zero conversions after 200 clicks → `replace`

6. **Generate insights** — surface 3–5 actionable observations

7. **Store report** — persist to `tiktok-performance` namespace

8. **Display report**:
   ```
   Performance Report — Campaign [ID]
   Period: [START] to [END]
   ───────────────────────────────────
   SUMMARY
   Views:        [N]
   Clicks:       [N]  (CTR: [X]%)
   Conversions:  [N]  (CVR: [X]%)
   GMV:          $[X]
   Commissions:  $[X]
   EPC:          $[X]

   PRODUCTS
   🔥 [Product A] — EPC $0.92, CVR 3.4% — SCALE
   📊 [Product B] — EPC $0.51, CVR 1.8% — MAINTAIN
   ⏸️ [Product C] — EPC $0.18, CVR 0.6% — PAUSE

   INSIGHTS
   1. [insight text]
   2. [insight text]
   3. [insight text]

   RECOMMENDATIONS
   → [action item]
   → [action item]
   ```

## CLI alternative

```bash
npx @claude-flow/cli@latest memory search \
  --namespace tiktok-performance \
  --query "campaign CAMPAIGN_ID performance report"
```

## Notes

- For live TikTok analytics, connect the TikTok Seller Center API via `tiktok config set api_key YOUR_KEY`
- Without API access, the analyst uses stored engagement estimates based on historical niche benchmarks
- A/B evaluations are automatically triggered by the campaign-orchestrator at 48-hour marks
