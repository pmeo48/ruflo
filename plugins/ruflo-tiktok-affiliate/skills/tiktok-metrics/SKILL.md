---
name: tiktok-metrics
description: Pull real performance data from TikTok Shop affiliate reporting API and TikTok video analytics — views, clicks, conversions, commissions — and feed results to the performance-analyst
argument-hint: "[--campaign <id>] [--content-id <id>] [--period 7d|14d|30d]"
allowed-tools: Bash mcp__claude-flow__memory_store mcp__claude-flow__memory_retrieve mcp__claude-flow__memory_search
---

# TikTok Metrics

Pull real performance data from two sources:
1. **TikTok video analytics** — views, watch time, hook rate (% watching past 3s), shares, comments, likes
2. **TikTok Shop affiliate reports** — clicks, conversions, GMV, commissions per product

Stores results in `tiktok-performance` namespace for the performance-analyst to evaluate.

## When to use

- 24 hours after posting: early hook rate signal
- 48 hours after posting: A/B test evaluation window
- 7 days after posting: full performance report
- On-demand: `tiktok metrics pull` at any time

## Parameters

- `--campaign <id>` — pull metrics for all content in a campaign (default: most recent active campaign)
- `--content-id <id>` — pull metrics for a single content package
- `--period <window>` — data window: `24h`, `48h`, `7d` (default), `14d`, `30d`
- `--source <api>` — data source: `video` (analytics only), `shop` (affiliate only), `all` (default)

## Data Sources

### Source 1: TikTok Video Analytics API

Requires: TikTok for Business API access token (OAuth 2.0)

```bash
# Get video analytics for a specific post
curl -s -X GET "https://business-api.tiktok.com/open_api/v1.3/video/list/" \
  -H "Access-Token: $TIKTOK_ACCESS_TOKEN" \
  -G \
  --data-urlencode "advertiser_id=$TIKTOK_ADVERTISER_ID" \
  --data-urlencode "filtering={\"video_ids\":[\"$TIKTOK_POST_ID\"]}" \
  --data-urlencode "fields=[\"video_id\",\"video_play_count\",\"video_watched_2s\",\"video_watched_6s\",\"clicks\",\"reach\",\"shares\",\"comments\",\"likes\"]" \
  --data-urlencode "start_date=$START_DATE" \
  --data-urlencode "end_date=$END_DATE"
```

Hook rate computed as: `video_watched_3s / video_play_count`

### Source 2: TikTok Shop Affiliate Reporting API

Requires: TikTok Shop Open API access token

```bash
# Get affiliate performance summary
curl -s -X GET "https://open-api.tiktok.com/affiliate/orders/search/" \
  -H "x-tts-access-token: $TIKTOK_SHOP_TOKEN" \
  -G \
  --data-urlencode "start_time=$START_TIMESTAMP" \
  --data-urlencode "end_time=$END_TIMESTAMP" \
  --data-urlencode "cursor=0" \
  --data-urlencode "page_size=100"
```

Returns: order list with `product_id`, `sale_amount`, `commission_amount`, `order_status`

## Steps

1. **Load API credentials** from `tiktok-config` namespace:
   - `tiktok_access_token` — Business API token
   - `tiktok_shop_token` — Shop Open API token
   - `tiktok_advertiser_id` — Business account advertiser ID

2. **Retrieve content IDs and post IDs** — for each content package in the campaign:
   - Fetch `tiktok_post_id` from content package in `tiktok-content` namespace
   - Skip packages with `scheduled_status != published`

3. **Pull video analytics** — for each published post ID, call the video analytics API. Extract:
   - `total_views` (play_count)
   - `hook_rate` (watched_3s / play_count)
   - `avg_watch_time_s`
   - `shares`, `comments`, `likes`
   - `profile_visits` (intent signal)

4. **Pull affiliate data** — call the TikTok Shop affiliate orders API for the campaign period. Match orders to content packages by product_id and timestamp window. Extract:
   - `clicks` per product (from affiliate dashboard)
   - `conversions` (completed orders)
   - `gmv_usd` (total purchase value)
   - `commission_usd` (your earned amount)

5. **Compute derived KPIs** per content package:
   ```
   CTR  = clicks / total_views
   CVR  = conversions / clicks
   EPC  = commission_usd / clicks
   ROAS = gmv_usd / 0  (organic — no ad spend)
   engagement_rate = (likes + comments + shares) / total_views
   ```

6. **Store raw metrics** — persist per-content metrics in `tiktok-performance`:
   ```bash
   npx @claude-flow/cli@latest memory store \
     --namespace tiktok-performance \
     --key "metrics-CONTENT_ID-YYYYMMDD" \
     --value "METRICS_JSON"
   ```

7. **Store campaign rollup** — aggregate across all content packages:
   ```bash
   npx @claude-flow/cli@latest memory store \
     --namespace tiktok-performance \
     --key "rollup-CAMPAIGN_ID-YYYYMMDD" \
     --value "ROLLUP_JSON"
   ```

8. **Notify performance-analyst** via SendMessage with the collected metrics for evaluation

9. **Display output**:
   ```
   Metrics Pull — Campaign [ID]
   ──────────────────────────────────────────────────────
   Period: [START] → [END]
   Posts pulled: [N]

   ┌──────────────────────────────┬────────┬──────┬──────┬───────┬──────────┐
   │ Content                      │ Views  │ HR%  │ CTR% │ CVR%  │ EPC      │
   ├──────────────────────────────┼────────┼──────┼──────┼───────┼──────────┤
   │ ITER2-NIRA-B                 │ 24,800 │ 61%  │ 4.2% │ 5.1%  │ $1.89    │
   │ ITER2-LED-A                  │ 18,200 │ 52%  │ 3.8% │ 3.9%  │ $1.02    │
   │ ITER2-LAMP-B                 │ 31,500 │ 58%  │ 3.1% │ 2.8%  │ $0.44    │
   └──────────────────────────────┴────────┴──────┴──────┴───────┴──────────┘

   Campaign totals: [N] views | [N] clicks | [N] conversions | $[X] GMV | $[X] commissions
   ```

## Metrics Schema

```json
{
  "metrics_id": "string",
  "content_id": "string",
  "product_id": "string",
  "campaign_id": "string",
  "period_start": "ISO8601",
  "period_end": "ISO8601",
  "pulled_at": "ISO8601",
  "video": {
    "total_views": 0,
    "hook_rate": 0.00,
    "avg_watch_time_s": 0,
    "shares": 0,
    "comments": 0,
    "likes": 0,
    "profile_visits": 0,
    "engagement_rate": 0.00
  },
  "affiliate": {
    "clicks": 0,
    "conversions": 0,
    "gmv_usd": 0.00,
    "commission_usd": 0.00,
    "ctr": 0.00,
    "cvr": 0.00,
    "epc_usd": 0.00
  }
}
```

## Error handling

- **Missing tiktok_post_id**: content was not yet published — skip and log
- **API rate limit (429)**: backoff 60s, retry up to 3 times
- **Token expired**: display instructions to refresh OAuth token
- **No affiliate data**: TikTok Shop has a 2–3 day reporting delay — note in output and retry next pull

## Config keys required

```bash
tiktok config set tiktok_access_token    <oauth-access-token>
tiktok config set tiktok_shop_token      <shop-api-access-token>
tiktok config set tiktok_advertiser_id   <business-advertiser-id>
```

OAuth setup:
- Business API: https://ads.tiktok.com/marketing_api/apps → Create App → get access token
- Shop API: https://partner.tiktok.com → Apps → TikTok Shop API → authorize

## Automation

The performance-analyst agent calls this skill automatically at 24h, 48h, and 7d after each content batch is published. Manual pull:

```bash
tiktok metrics pull --campaign <id> --period 7d
```

## Notes

- TikTok Shop affiliate reporting has a **48-hour data delay** — clicks and orders from the last 48h are estimates
- Video analytics (views, hook rate) are near-real-time (1–2 hour delay)
- For accounts not yet approved for TikTok Business API, use TikTok Studio (studio.tiktok.com) to manually export analytics as CSV — the performance-analyst can parse the CSV as a fallback
