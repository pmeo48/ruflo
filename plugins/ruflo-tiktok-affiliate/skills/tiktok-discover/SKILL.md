---
name: tiktok-discover
description: Scan TikTok Shop for trending products and score affiliate potential
argument-hint: "[--niche beauty|fashion|home|tech|fitness|food] [--limit 20] [--min-score 0.45]"
allowed-tools: Bash mcp__claude-flow__memory_store mcp__claude-flow__memory_search mcp__claude-flow__memory_retrieve mcp__claude-flow__embeddings_generate mcp__claude-flow__ruvllm_hnsw_add mcp__claude-flow__ruvllm_hnsw_route
---

# TikTok Discover

Discover trending TikTok Shop products with high affiliate potential, score them, and store results for content planning.

## When to use

When you need to find new affiliate products to promote — at the start of a campaign iteration, when existing products are underperforming, or on a scheduled discovery run.

## Parameters

- `--niche <name>` — filter by niche (beauty, fashion, home, tech, fitness, food). Omit for all niches.
- `--limit <n>` — max products to return (default: 20)
- `--min-score <n>` — minimum affiliate potential score (default: 0.45)
- `--commission-min <n>` — minimum commission rate percent (default: 8)

## Steps

1. **Query trending products** — fetch from TikTok Shop affiliate marketplace or use cached trend data. If no live data source is configured, generate a realistic simulated dataset based on known TikTok Shop trends for the specified niche.

2. **Score each product** using the composite formula:
   ```
   score = (commission_rate * 0.35)
         + (trend_velocity * 0.30)
         + (review_score * 0.20)
         + (low_competition_bonus * 0.15)
   ```

3. **Filter** to products meeting `--min-score` threshold

4. **Store results** via `mcp__claude-flow__memory_store`:
   - Namespace: `tiktok-affiliate`
   - Key: `products-trending-YYYYMMDD[-NICHE]`
   - Value: JSON array of product objects

5. **Generate embeddings** for product descriptions using `mcp__claude-flow__embeddings_generate` and add to HNSW index via `mcp__claude-flow__ruvllm_hnsw_add`

6. **Report results** in a structured table:
   ```
   TikTok Shop Discovery — [DATE]
   ─────────────────────────────────
   Scanned:  [N] products
   Hot (≥0.65): [N]
   Warm (0.45–0.65): [N]
   Cold (<0.45): [N]

   TOP PRODUCTS
   ┌─────────────────────────┬───────┬──────────┬──────┐
   │ Product                 │ Score │ Comm.    │ Tier │
   ├─────────────────────────┼───────┼──────────┼──────┤
   │ [name]                  │ 0.82  │ 15% ($X) │ 🔥   │
   └─────────────────────────┴───────┴──────────┴──────┘
   ```

## CLI alternative

```bash
npx @claude-flow/cli@latest memory search \
  --namespace tiktok-affiliate \
  --query "trending products beauty high commission"
```

## Notes

- Results are stored for 48 hours before being marked stale
- Use `/tiktok-campaign` to automatically trigger discovery as part of a full campaign
- Hot products (score ≥ 0.65) are automatically forwarded to content-strategist when running in campaign mode
