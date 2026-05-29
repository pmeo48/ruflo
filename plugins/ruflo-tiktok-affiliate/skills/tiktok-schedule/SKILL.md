---
name: tiktok-schedule
description: Schedule a generated TikTok video for automatic posting at the optimal time using the Later or Publer API
argument-hint: "<content-id> [--time <ISO8601>] [--platform later|publer]"
allowed-tools: Bash mcp__claude-flow__memory_store mcp__claude-flow__memory_retrieve mcp__claude-flow__memory_search
---

# TikTok Schedule

Schedule a rendered video for automatic posting to TikTok at the optimal time. Reads the content package (which must have a `video_url` from `tiktok-video-generate`), pushes the video and metadata to Later or Publer, and stores the scheduled post ID for tracking.

## When to use

After `tiktok video generate` has produced a `video_url` in the content package. Call this to queue the video for posting without manually opening TikTok.

## Parameters

- `<content-id>` — content package ID with a completed `video_url` (required)
- `--time <ISO8601>` — override post time (default: uses `post_schedule` from content package)
- `--platform <name>` — scheduler platform: `later` (default) or `publer`
- `--account <id>` — TikTok account ID if managing multiple accounts (default: primary account)

## Steps

1. **Load credentials** — retrieve scheduler API token from `tiktok-config` namespace:
   - For Later: key `later_api_token`
   - For Publer: key `publer_api_token`
   - TikTok account ID: key `tiktok_account_id`

2. **Retrieve content package** — fetch from `tiktok-content` namespace; verify `video_url` is present and `render_status` is `done`

3. **Determine post time** — use `--time` override if provided, otherwise use `post_schedule` field from the content package. Convert to UTC.

4. **Upload video to scheduler**:

   **Later:**
   ```bash
   # Step 1: Upload media
   curl -s -X POST "https://api.later.com/v2/media" \
     -H "Authorization: Bearer $LATER_API_TOKEN" \
     -F "url=[VIDEO_URL]" \
     -F "media_type=video"

   # Step 2: Schedule post
   curl -s -X POST "https://api.later.com/v2/posts" \
     -H "Authorization: Bearer $LATER_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "profile_id": "[TIKTOK_PROFILE_ID]",
       "media_ids": ["[MEDIA_ID]"],
       "caption": "[CAPTION_WITH_HASHTAGS]",
       "when": "[ISO8601_POST_TIME]"
     }'
   ```

   **Publer:**
   ```bash
   curl -s -X POST "https://app.publer.io/api/v1/post" \
     -H "Authorization: Bearer $PUBLER_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "profiles": ["[TIKTOK_PROFILE_ID]"],
       "text": "[CAPTION_WITH_HASHTAGS]",
       "media_urls": ["[VIDEO_URL]"],
       "schedule_date": "[ISO8601_POST_TIME]",
       "post_type": "post"
     }'
   ```

5. **Handle TikTok-specific requirements**:
   - Caption must be ≤ 2,200 characters
   - Hashtags included in the caption (not separate)
   - TikTok requires user authorization via OAuth — both Later and Publer handle this in their dashboard; the account must be connected before first use

6. **Store scheduled post metadata** — update content package in memory:
   ```json
   {
     "scheduled_post_id": "string",
     "scheduled_platform": "later|publer",
     "scheduled_time_utc": "ISO8601",
     "scheduled_status": "queued",
     "tiktok_post_id": null
   }
   ```

7. **Display output**:
   ```
   Scheduled — [CONTENT_ID]
   ────────────────────────────────────────
   Product:   [PRODUCT_NAME]
   Platform:  Later
   Post time: [DAY] [DATE] at [TIME] EST
   Status:    ✅ Queued

   Caption preview:
   "[FIRST 100 CHARS OF CAPTION]..."
   Hashtags: [N] tags included

   Post ID: [SCHEDULED_POST_ID]
   Track: tiktok track --campaign [CAMPAIGN_ID]
   ```

## After Posting

Once TikTok publishes the video, Later/Publer returns the TikTok post ID. The `tiktok-metrics` skill uses this ID to pull video analytics. The system updates the content package:

```json
{
  "tiktok_post_id": "7380000000000000001",
  "tiktok_post_url": "https://www.tiktok.com/@username/video/...",
  "published_at": "ISO8601",
  "scheduled_status": "published"
}
```

## Error handling

- **Video URL expired**: re-fetch from Creatify using stored `video_job_id`
- **Caption too long**: truncate hashtags to fit 2,200 char limit, keep body text intact
- **Account not connected**: display instructions to connect TikTok account in Later/Publer dashboard
- **Scheduling conflict** (post time in past): reschedule to next optimal window for the niche

## Config keys required

```bash
tiktok config set later_api_token      <your-api-token>
tiktok config set later_profile_id     <your-tiktok-profile-id>
# OR
tiktok config set publer_api_token     <your-api-token>
tiktok config set publer_profile_id    <your-tiktok-profile-id>
```

Get Later API token: https://app.later.com → Settings → API
Get Publer API token: https://app.publer.io → Settings → API Keys

## Batch scheduling

Schedule all pending content packages for a campaign at once:

```bash
tiktok schedule --campaign <campaign-id> --all-pending
```

This reads all content packages with `render_status: done` and `scheduled_status: null`, and schedules them using the `post_schedule` times from each package.

## Notes

- Both Later and Publer require TikTok account to be connected via OAuth in their dashboards — this is a one-time manual step
- TikTok's Content Posting API (used by Later/Publer) requires the account to have 1,000+ followers to enable third-party posting
- For accounts under 1,000 followers, Later/Publer will send a mobile push notification reminder — you tap to confirm the post from your phone
- TikTok's direct scheduling (via TikTok Studio) does not require follower threshold and is an alternative for low-follower accounts
