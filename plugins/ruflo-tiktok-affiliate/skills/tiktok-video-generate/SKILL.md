---
name: tiktok-video-generate
description: Generate a TikTok-ready video from a content package using the Creatify AI video API — takes a script and product images and renders a complete video file
argument-hint: "<content-id> [--avatar <avatar-id>] [--voice <voice-id>] [--aspect 9:16]"
allowed-tools: Bash mcp__claude-flow__memory_store mcp__claude-flow__memory_retrieve mcp__claude-flow__memory_search
---

# TikTok Video Generate

Render a TikTok-ready video from a content package using the Creatify AI video API. Takes the script, hook, captions, and product images from the content package and produces an MP4 video file ready for posting.

## When to use

After `tiktok script` or `tiktok create` has generated a content package and you want to render an actual video without filming manually.

## Parameters

- `<content-id>` — content package ID from `tiktok-content` namespace (required)
- `--avatar <id>` — Creatify avatar ID (default: reads from `tiktok-config` namespace key `creatify_avatar_id`)
- `--voice <id>` — Creatify voice ID (default: reads from `tiktok-config` key `creatify_voice_id`)
- `--aspect <ratio>` — video aspect ratio: `9:16` (default, TikTok), `1:1`, `16:9`
- `--quality <level>` — render quality: `standard`, `high` (default: `high`)

## Steps

1. **Load API credentials** — retrieve `creatify_api_id` and `creatify_api_key` from `tiktok-config` namespace

2. **Retrieve content package** — fetch from `tiktok-content` namespace using content-id

3. **Build video spec** — construct the Creatify AI video request:
   - `script`: full spoken script from all 5 scenes concatenated
   - `visual_style`: map content format to Creatify style (`ugc` → `talking_head`, `transformation` → `before_after`, `tutorial` → `tutorial`)
   - `aspect_ratio`: `9:16`
   - `background_music`: auto-select based on niche (upbeat for fitness, calm for beauty)
   - `caption_style`: bold white text with black outline (TikTok default)

4. **Submit render job** — POST to Creatify API:
   ```bash
   curl -s -X POST "https://api.creatify.ai/api/ai_video_v2/" \
     -H "X-API-ID: $CREATIFY_API_ID" \
     -H "X-API-KEY: $CREATIFY_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "script": "[FULL_SCRIPT]",
       "avatar_id": "[AVATAR_ID]",
       "voice_id": "[VOICE_ID]",
       "aspect_ratio": "9:16",
       "caption_setting": {
         "style": "bold",
         "font_color": "#FFFFFF",
         "background_color": "#000000",
         "font_size": 24
       },
       "name": "[CONTENT_ID]-render"
     }'
   ```

5. **Poll for completion** — check render status every 30 seconds (max 10 minutes):
   ```bash
   curl -s "https://api.creatify.ai/api/ai_video_v2/{job_id}/" \
     -H "X-API-ID: $CREATIFY_API_ID" \
     -H "X-API-KEY: $CREATIFY_API_KEY"
   ```
   Status values: `pending` → `processing` → `done` | `failed`

6. **Extract video URL** — from completed job response: `response.video_output`

7. **Update content package** — add video metadata to the content package in memory:
   ```json
   {
     "video_url": "https://...",
     "video_job_id": "string",
     "video_duration_s": 45,
     "video_format": "mp4",
     "video_aspect": "9:16",
     "render_completed_at": "ISO8601",
     "render_status": "done"
   }
   ```

8. **Display output**:
   ```
   Video Generated — [CONTENT_ID]
   ──────────────────────────────
   Status:   ✅ Rendered
   Duration: 45s
   Format:   MP4 9:16 (TikTok-ready)
   URL:      [VIDEO_URL]

   Next step: tiktok schedule [CONTENT_ID]
   ```

## Error handling

- **Job failed**: retry once with `quality: standard`; if still fails, output error and stop
- **Timeout after 10 minutes**: save job_id to content package with status `rendering` — user can check later with `tiktok video status <job-id>`
- **Missing API credentials**: display setup instructions (run `tiktok config set creatify_api_id <id>`)

## Config keys required

```bash
tiktok config set creatify_api_id     <your-api-id>
tiktok config set creatify_api_key    <your-api-key>
tiktok config set creatify_avatar_id  <your-avatar-id>
tiktok config set creatify_voice_id   <your-voice-id>
```

Get these at: https://app.creatify.ai → Settings → API

## CLI alternative

```bash
# Check render job status
tiktok video status <job-id>

# Retrieve video URL after render
npx @claude-flow/cli@latest memory retrieve \
  --namespace tiktok-content \
  --key "content-PRODUCT_ID-A-YYYYMMDD" \
  | jq '.video_url'
```

## Notes

- Creatify renders take 2–8 minutes depending on script length and quality setting
- Avatar must be created in Creatify dashboard first — upload a 2-minute face recording to generate a reusable avatar
- For product-demo content, use Creatify's `link_to_video` endpoint instead: provide the TikTok Shop product URL and it auto-generates a demo video using the product images
- `link_to_video` is faster (1–3 min) but has less script control — use for quick iterations
