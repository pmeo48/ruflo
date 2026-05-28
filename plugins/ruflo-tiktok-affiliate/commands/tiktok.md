---
name: tiktok
description: TikTok Shop affiliate marketing — product discovery, content generation, performance tracking, and autonomous campaign management
---

TikTok Shop affiliate marketing commands:

**`tiktok discover [--niche <name>] [--limit 20]`** — Discover trending TikTok Shop products.
1. Spawn product-scout agent with the given niche filter (all niches if omitted)
2. Compute affiliate potential scores: commission_rate (35%), trend_velocity (30%), review_score (20%), low_competition_bonus (15%)
3. Filter to score ≥ 0.45 (hot ≥ 0.65, warm 0.45–0.65, cold < 0.45)
4. Store results via `mcp__claude-flow__memory_store` in `tiktok-affiliate` namespace with key `products-trending-YYYYMMDD`
5. Display: products scanned, hot/warm/cold counts, top 10 table with name, score, commission, tier

**`tiktok score <product-id>`** — Score a specific product's affiliate potential.
1. Retrieve product data from memory or accept product URL/ID as input
2. Compute all five score components with individual breakdowns
3. Show composite score, tier classification, and recommendation (promote / test / skip)
4. List 2–3 competing products from memory for context

**`tiktok strategy <product-id> [--format short]`** — Generate a content strategy for a product.
1. Retrieve product data from `tiktok-affiliate` namespace
2. Select optimal content format based on niche CVR benchmarks
3. Generate 5 hook angle options
4. Recommend posting schedule (day + time + timezone)
5. Build hashtag set (primary 3, secondary 5, CTA 2)
6. Store strategy in `tiktok-strategy` namespace with key `strategy-PRODUCT_ID-YYYYMMDD`
7. Display: format, selected hook, posting windows, hashtags, 3-sentence content brief

**`tiktok script <product-id> [--style ugc]`** — Write a complete TikTok video script.
1. Retrieve product data and strategy plan
2. Generate word-for-word script with 5 scenes: Hook (0–3s), Setup (3–15s), Reveal (15–25s), Proof (25–40s), CTA (40–45s)
3. Include camera directions, B-roll suggestions, and text overlay notes for each scene
4. Store in `tiktok-content` namespace with key `script-PRODUCT_ID-YYYYMMDD`
5. Display full script with timing markers and camera directions

**`tiktok caption <product-id>`** — Generate caption and hashtag set.
1. Retrieve product data and hook from strategy
2. Write caption: hook sentence + 2 value lines + CTA line + affiliate link note
3. Build optimized hashtag set (10–12 tags, mixed tiers)
4. Check hashtags against known banned/suppressed tags
5. Display: full caption ready to paste, hashtag analysis (tier breakdown, estimated reach per tag)

**`tiktok hook <product-id> [--count 5]`** — Generate opening hook options.
1. Retrieve product details and niche
2. Generate N hooks covering: pain-point, desire, social-proof, curiosity, and transformation angles
3. Score each hook on: specificity, curiosity gap, length (< 10 words preferred), action-orientation
4. Rank and display all hooks with scores and rationale

**`tiktok track [--campaign <id>] [--period 7d]`** — Fetch performance metrics for a campaign.
1. Retrieve campaign config and content IDs from memory
2. Compute KPIs per product: Hook Rate, CTR, CVR, EPC, GMV, Engagement Rate
3. Run A/B test evaluation if variants have ≥100 clicks each
4. Apply decision rules: top (scale), average (maintain), pause, replace
5. Generate 3–5 insights and 2–3 recommendation action items
6. Store report in `tiktok-performance` namespace
7. Display: summary KPIs, product-level table with status icons, insights, recommendations

**`tiktok optimize <campaign-id>`** — Generate optimization recommendations for a campaign.
1. Retrieve all performance reports for the campaign from `tiktok-performance`
2. Analyze trends across iterations: rising/falling products, niche EPC benchmarks
3. Identify top performers to scale (duplicate content), under-performers to pause
4. Recommend niche allocation adjustments based on EPC trajectory
5. Suggest hook style changes based on variant performance data
6. Display: what to scale, what to pause, what to change in content strategy, niche allocation pie chart (text)

**`tiktok campaign create <goal>`** — Create and launch a new autonomous campaign.
1. Parse goal for target GMV, niche hints, and timeline
2. Generate campaign ID and configuration
3. Initialize swarm via `mcp__claude-flow__swarm_init` (hierarchical, 6 agents)
4. Spawn all 5 agents in background
5. Send first discovery task to product-scout
6. Store campaign config in `tiktok-campaigns` namespace
7. Display: campaign ID, agent roster, iteration schedule, tracking command

**`tiktok campaign status <campaign-id>`** — Show campaign progress and iteration summary.
1. Retrieve campaign state from `tiktok-campaigns` namespace
2. Show: current iteration, products active/paused, latest KPIs, next iteration time
3. Display agent status (active/idle/waiting) if campaign is running
4. Show iteration history table with per-iteration EPC, GMV, and key insight

**`tiktok campaign pause <campaign-id>`** — Pause a running campaign.
1. Retrieve campaign state and update status to `paused`
2. Send `{ type: "shutdown_request" }` to all active campaign agents via SendMessage
3. Store pause timestamp and current metrics snapshot
4. Display: campaign paused, current GMV progress, resume command

**`tiktok campaign resume <campaign-id>`** — Resume a paused campaign.
1. Retrieve campaign config and last iteration state
2. Re-spawn agents with briefing on where to pick up
3. Start next discovery run from where the campaign left off
4. Display: campaign resumed, iteration N continuing, estimated next check-in time

**`tiktok products list [--niche <name>]`** — List all tracked affiliate products.
1. Search `tiktok-affiliate` namespace for all product entries matching niche filter
2. Sort by score descending
3. Display: name, niche, commission, score, tier, discovery date, status (active/paused/retired)

**`tiktok products add <product-url>`** — Add a product to tracking.
1. Parse product URL/ID to extract product metadata
2. Compute affiliate potential score
3. Store in `tiktok-affiliate` namespace
4. Display: product added, score, tier, recommended action

**`tiktok products remove <product-id>`** — Remove a product from active tracking.
1. Retrieve product record
2. Mark as `retired` in memory (do not delete — keep history)
3. Display: product removed, final performance summary if it had campaign history

**`tiktok trends [--category <name>]`** — Show TikTok trend analysis.
1. Search `tiktok-affiliate` namespace for recent trend data
2. Compute: niche EPC benchmarks this week vs last week, rising/falling niches, top hook styles
3. Show trending audio formats that correlate with high engagement
4. Display: niche performance table, trend direction arrows, top 3 content formats this week

**`tiktok earnings [--period 30d]`** — Summary of affiliate earnings.
1. Retrieve all performance reports in the period from `tiktok-performance`
2. Sum: total views, clicks, conversions, GMV, commissions
3. Compute: overall EPC, best day, best product, best niche
4. Display: earnings dashboard with period totals, daily breakdown chart (text), top performers

**`tiktok leaderboard [--limit 10]`** — Top performing products all-time.
1. Search `tiktok-performance` namespace for all product performance entries
2. Rank by total commissions earned
3. Display: rank, product name, niche, total GMV, total commissions, best EPC, best content format

**`tiktok export <campaign-id> [--format csv]`** — Export campaign data.
1. Retrieve all campaign, product, content, and performance data for the campaign
2. Serialize to requested format (json default, csv with --format csv)
3. Save to `/tmp/tiktok-export-CAMPAIGN_ID-YYYYMMDD.json` (or .csv)
4. Display: export path, row count, fields included

**`tiktok config set <key> <value>`** — Configure plugin settings.
1. Valid keys: `api_key`, `default_niches`, `min_commission`, `default_duration`, `posting_timezone`, `affiliate_username`
2. Store in `tiktok-config` memory namespace
3. Display: key set, current full config summary
