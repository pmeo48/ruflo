# ruflo-tiktok-affiliate — API Integrations Setup

Three external APIs close the full automation loop: video generation, scheduling, and metrics.

## Overview

```
Content Package (script + caption)
         │
         ▼
[1] Creatify API ──────── renders MP4 video (2–8 min)
         │
         ▼
[2] Later / Publer API ── schedules post to TikTok (automated)
         │
         ▼  (after post goes live)
[3] TikTok APIs ──────── pulls views, CTR, CVR, commissions
         │
         ▼
performance-analyst ───── makes scale/pause/replace decisions
```

---

## 1. Creatify — AI Video Generation

**What it does:** Takes your script and generates a talking-head TikTok video using your AI avatar. No filming required.

**Cost:** ~$0.50–$2.00 per video depending on plan. A $49/month plan includes ~50 videos.

### Setup

**Step 1 — Create account**
Go to https://app.creatify.ai and sign up.

**Step 2 — Create your avatar**
- Settings → Avatars → Create Avatar
- Record a 2-minute video of yourself speaking naturally (good lighting, stable camera)
- Creatify processes it in ~24 hours
- Copy your Avatar ID from the avatar settings page

**Step 3 — Choose a voice**
- Settings → Voices → browse available voices OR use your avatar's cloned voice
- Copy your Voice ID

**Step 4 — Get API credentials**
- Settings → API → Copy API ID and API Key

**Step 5 — Store in plugin config**
```bash
tiktok config set creatify_api_id     <your-api-id>
tiktok config set creatify_api_key    <your-api-key>
tiktok config set creatify_avatar_id  <your-avatar-id>
tiktok config set creatify_voice_id   <your-voice-id>
```

**Test the connection:**
```bash
curl -s -X GET "https://api.creatify.ai/api/avatar_list/" \
  -H "X-API-ID: $CREATIFY_API_ID" \
  -H "X-API-KEY: $CREATIFY_API_KEY" | jq '.count'
# Should return a number > 0
```

### Alternative: Link-to-Video (faster, less control)

For product demo videos without a talking head, Creatify can generate a video directly from the TikTok Shop product URL:

```bash
curl -s -X POST "https://api.creatify.ai/api/link_to_video/" \
  -H "X-API-ID: $CREATIFY_API_ID" \
  -H "X-API-KEY: $CREATIFY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://shop.tiktok.com/us/pdp/[product-slug]/[id]",
    "aspect_ratio": "9:16",
    "target_platform": "tiktok"
  }'
```

Use `link_to_video` for quick product showcase videos. Use `ai_video_v2` for the full scripted talking-head format.

---

## 2. Later — Automated TikTok Scheduling

**What it does:** Receives your rendered video + caption and posts it to TikTok at your scheduled time automatically.

**Cost:** $25/month (Starter plan) includes TikTok scheduling.

**Alternative:** Publer ($12/month) — same capability, lower cost.

### Setup — Later

**Step 1 — Create Later account**
Go to https://app.later.com and sign up.

**Step 2 — Connect your TikTok account**
- Later dashboard → Social Profiles → Add Profile → TikTok
- Authorize Later to post to your TikTok account via OAuth
- This is the only manual step — done once

**Step 3 — Get API token**
- Later → Settings → API → Generate API Token
- Copy the token

**Step 4 — Get your TikTok Profile ID**
```bash
curl -s "https://api.later.com/v2/profiles" \
  -H "Authorization: Bearer $LATER_TOKEN" | jq '.data[] | select(.platform=="tiktok") | .id'
```

**Step 5 — Store credentials**
```bash
tiktok config set later_api_token   <your-token>
tiktok config set later_profile_id  <your-tiktok-profile-id>
```

### Setup — Publer (alternative)

**Step 1 — Create account** at https://app.publer.io

**Step 2 — Connect TikTok** → Profiles → Add → TikTok → OAuth

**Step 3 — Get API key** → Account → API Keys → Generate

**Step 4 — Get profile ID**
```bash
curl -s "https://app.publer.io/api/v1/profiles" \
  -H "Authorization: Bearer $PUBLER_TOKEN" | jq '.[] | select(.type=="tiktok") | .id'
```

**Step 5 — Store credentials**
```bash
tiktok config set publer_api_token   <your-token>
tiktok config set publer_profile_id  <your-tiktok-profile-id>
```

### Important: Follower Threshold

TikTok's Content Posting API (used by Later/Publer) requires **1,000 followers** to post automatically without confirmation.

- **Under 1,000 followers**: Later/Publer sends a push notification to your phone — you tap one button to confirm the post. Still semi-automated.
- **Over 1,000 followers**: Fully automatic, no phone action needed.

---

## 3. TikTok APIs — Real Metrics

Two separate APIs provide the performance data:

### 3a. TikTok Business API (video analytics)

**What it provides:** Views, watch time, hook rate, engagement per video.

**Step 1 — Create TikTok for Business account**
- Go to https://ads.tiktok.com
- Sign up with your TikTok account

**Step 2 — Create a Marketing API app**
- https://ads.tiktok.com/marketing_api/apps → Create App
- App type: Web
- Permissions: `Video Management`, `Audience Management`

**Step 3 — Get Access Token**
- Copy the app's `App ID` and `Secret`
- Generate access token via OAuth flow OR use the sandbox token for testing

**Step 4 — Store credentials**
```bash
tiktok config set tiktok_access_token   <oauth-access-token>
tiktok config set tiktok_advertiser_id  <your-advertiser-id>
```

**Test:**
```bash
curl -s "https://business-api.tiktok.com/open_api/v1.3/user/info/" \
  -H "Access-Token: $TIKTOK_ACCESS_TOKEN" | jq '.data.display_name'
```

### 3b. TikTok Shop Open API (affiliate/sales data)

**What it provides:** Clicks, conversions, GMV, commissions per product.

**Step 1 — Register as TikTok Shop partner**
- Go to https://partner.tiktok.com
- Register as a Developer

**Step 2 — Create an app**
- Partner Center → Apps → Create App
- Select "TikTok Shop" as the app type
- Request permission: `Affiliate Order Management`

**Step 3 — Authorize your seller/affiliate account**
- After app approval, generate an access token for your account
- Token type: `AUTHORIZED_ACCESS_TOKEN`

**Step 4 — Store credentials**
```bash
tiktok config set tiktok_shop_token  <your-shop-access-token>
```

**Test:**
```bash
curl -s -X GET "https://open-api.tiktok.com/affiliate/orders/search/" \
  -H "x-tts-access-token: $TIKTOK_SHOP_TOKEN" \
  -G --data-urlencode "start_time=$(date -d '7 days ago' +%s)" \
  --data-urlencode "end_time=$(date +%s)" | jq '.data.total'
```

### Fallback: Manual CSV Export

If TikTok API approval takes time (it can take 1–2 weeks), use the manual fallback:

1. TikTok Studio (studio.tiktok.com) → Analytics → Export CSV
2. TikTok Shop → Seller Center → Affiliate → Performance → Export
3. Run `tiktok metrics import --file analytics.csv --type video`
4. Run `tiktok metrics import --file affiliate-report.csv --type shop`

The performance-analyst accepts both live API data and imported CSVs.

---

## Quick Setup Checklist

```
[ ] Creatify account created
[ ] 2-minute avatar recording uploaded → avatar ID noted
[ ] Creatify API ID and API Key copied
[ ] tiktok config set creatify_api_id ...
[ ] tiktok config set creatify_api_key ...
[ ] tiktok config set creatify_avatar_id ...
[ ] tiktok config set creatify_voice_id ...

[ ] Later (or Publer) account created
[ ] TikTok account connected via OAuth in Later/Publer dashboard
[ ] Later API token generated → profile ID noted
[ ] tiktok config set later_api_token ...
[ ] tiktok config set later_profile_id ...

[ ] TikTok for Business account created
[ ] Marketing API app created → access token generated
[ ] tiktok config set tiktok_access_token ...
[ ] tiktok config set tiktok_advertiser_id ...

[ ] TikTok Shop Partner account created (or use manual CSV fallback)
[ ] tiktok config set tiktok_shop_token ...

[ ] Run: tiktok setup apis  (validates all connections)
```

---

## Full Automation Test

Once all APIs are configured, run a test with a single content package:

```bash
# 1. Generate video for one content package
tiktok video generate ITER2-LED-A

# 2. Check render status (2–5 min)
tiktok video status <job-id>

# 3. Schedule when done
tiktok schedule ITER2-LED-A --time "2026-06-01T12:00:00Z"

# 4. Pull metrics 24h after it posts
tiktok metrics pull --content-id ITER2-LED-A --period 24h
```

If all four commands succeed, the full automation loop is working.
