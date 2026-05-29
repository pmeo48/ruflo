#!/usr/bin/env bash
# ruflo-tiktok-affiliate — API integration setup wizard
# Walks through Creatify, Later/Publer, and TikTok API configuration.
# Run: bash scripts/setup-apis.sh

set -euo pipefail

MEMORY_CMD="npx @claude-flow/cli@latest memory store --namespace tiktok-config"

echo "╔══════════════════════════════════════════════════╗"
echo "║   ruflo-tiktok-affiliate — API Setup Wizard      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "This wizard configures the three APIs needed for full automation:"
echo "  1. Creatify  — AI video generation"
echo "  2. Later     — Automated TikTok scheduling"
echo "  3. TikTok    — Performance metrics"
echo ""
echo "Docs: plugins/ruflo-tiktok-affiliate/docs/api-integrations.md"
echo ""

# ──────────────────────────────────────────────────────
# STEP 1: Creatify
# ──────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1 — Creatify AI Video Generation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Sign up at https://app.creatify.ai"
echo "Then: Settings → API → copy API ID and API Key"
echo "And:  Settings → Avatars → create avatar → copy Avatar ID"
echo ""

read -p "Enter Creatify API ID: " CREATIFY_API_ID
read -s -p "Enter Creatify API Key: " CREATIFY_API_KEY
echo ""
read -p "Enter Creatify Avatar ID: " CREATIFY_AVATAR_ID
read -p "Enter Creatify Voice ID (or press Enter to skip): " CREATIFY_VOICE_ID

# Validate Creatify credentials
echo ""
echo "▶ Testing Creatify connection..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://api.creatify.ai/api/avatar_list/" \
  -H "X-API-ID: $CREATIFY_API_ID" \
  -H "X-API-KEY: $CREATIFY_API_KEY" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "  ✅ Creatify: connected"
  $MEMORY_CMD --key "creatify_api_id"    --value "$CREATIFY_API_ID"
  $MEMORY_CMD --key "creatify_api_key"   --value "$CREATIFY_API_KEY"
  $MEMORY_CMD --key "creatify_avatar_id" --value "$CREATIFY_AVATAR_ID"
  [ -n "$CREATIFY_VOICE_ID" ] && $MEMORY_CMD --key "creatify_voice_id" --value "$CREATIFY_VOICE_ID"
  echo "  ✅ Credentials stored"
else
  echo "  ⚠️  Creatify: connection failed (HTTP $HTTP_STATUS)"
  echo "     Check your API ID and Key at https://app.creatify.ai → Settings → API"
  echo "     Credentials NOT stored — re-run setup after fixing credentials"
fi

echo ""

# ──────────────────────────────────────────────────────
# STEP 2: Scheduler (Later or Publer)
# ──────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2 — TikTok Post Scheduler"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Choose your scheduling platform:"
echo "  [1] Later  — https://app.later.com  (\$25/mo)"
echo "  [2] Publer — https://app.publer.io  (\$12/mo)"
echo ""

read -p "Choose [1/2]: " SCHEDULER_CHOICE

if [ "$SCHEDULER_CHOICE" = "1" ]; then
  echo ""
  echo "Later setup:"
  echo "  1. Go to https://app.later.com"
  echo "  2. Connect your TikTok account: Social Profiles → Add → TikTok"
  echo "  3. Get API token: Settings → API → Generate Token"
  echo "  4. Get profile ID — we'll fetch it automatically after you enter your token"
  echo ""

  read -s -p "Enter Later API Token: " LATER_TOKEN
  echo ""

  echo "▶ Testing Later connection and fetching TikTok profile ID..."
  PROFILES=$(curl -s "https://api.later.com/v2/profiles" \
    -H "Authorization: Bearer $LATER_TOKEN" 2>/dev/null || echo '{"error":true}')

  if echo "$PROFILES" | jq -e '.data' > /dev/null 2>&1; then
    LATER_PROFILE_ID=$(echo "$PROFILES" | jq -r '.data[] | select(.platform=="tiktok") | .id' | head -1)
    if [ -n "$LATER_PROFILE_ID" ]; then
      echo "  ✅ Later: connected"
      echo "  ✅ TikTok profile found: $LATER_PROFILE_ID"
      $MEMORY_CMD --key "later_api_token"  --value "$LATER_TOKEN"
      $MEMORY_CMD --key "later_profile_id" --value "$LATER_PROFILE_ID"
      echo "  ✅ Credentials stored"
    else
      echo "  ⚠️  Later connected but no TikTok profile found"
      echo "     Connect your TikTok account in Later dashboard first, then re-run setup"
    fi
  else
    echo "  ⚠️  Later: connection failed — check your API token"
  fi

elif [ "$SCHEDULER_CHOICE" = "2" ]; then
  echo ""
  echo "Publer setup:"
  echo "  1. Go to https://app.publer.io"
  echo "  2. Connect your TikTok account: Profiles → Add → TikTok"
  echo "  3. Get API key: Account → API Keys → Generate"
  echo ""

  read -s -p "Enter Publer API Token: " PUBLER_TOKEN
  echo ""

  echo "▶ Testing Publer connection..."
  PROFILES=$(curl -s "https://app.publer.io/api/v1/profiles" \
    -H "Authorization: Bearer $PUBLER_TOKEN" 2>/dev/null || echo '[]')

  PUBLER_PROFILE_ID=$(echo "$PROFILES" | jq -r '.[] | select(.type=="tiktok") | .id' | head -1)
  if [ -n "$PUBLER_PROFILE_ID" ]; then
    echo "  ✅ Publer: connected"
    echo "  ✅ TikTok profile found: $PUBLER_PROFILE_ID"
    $MEMORY_CMD --key "publer_api_token"  --value "$PUBLER_TOKEN"
    $MEMORY_CMD --key "publer_profile_id" --value "$PUBLER_PROFILE_ID"
    $MEMORY_CMD --key "scheduler_platform" --value "publer"
    echo "  ✅ Credentials stored"
  else
    echo "  ⚠️  Publer: connection failed or no TikTok profile found"
    echo "     Connect your TikTok account in Publer dashboard, then re-run setup"
  fi
fi

echo ""

# ──────────────────────────────────────────────────────
# STEP 3: TikTok APIs
# ──────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3 — TikTok Performance APIs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Note: TikTok API approval can take 1–2 weeks."
echo "You can skip this and use manual CSV export as a fallback."
echo ""
echo "  Business API docs: https://ads.tiktok.com/marketing_api/apps"
echo "  Shop API docs:     https://partner.tiktok.com"
echo ""

read -p "Do you have TikTok API credentials? [y/N]: " HAS_TIKTOK_CREDS

if [ "$HAS_TIKTOK_CREDS" = "y" ] || [ "$HAS_TIKTOK_CREDS" = "Y" ]; then
  read -s -p "Enter TikTok Business API Access Token: " TIKTOK_ACCESS_TOKEN
  echo ""
  read -p "Enter TikTok Advertiser ID: " TIKTOK_ADVERTISER_ID
  read -s -p "Enter TikTok Shop API Token (or press Enter to skip): " TIKTOK_SHOP_TOKEN
  echo ""

  echo "▶ Testing TikTok Business API..."
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://business-api.tiktok.com/open_api/v1.3/user/info/" \
    -H "Access-Token: $TIKTOK_ACCESS_TOKEN" 2>/dev/null || echo "000")

  if [ "$HTTP_STATUS" = "200" ]; then
    echo "  ✅ TikTok Business API: connected"
    $MEMORY_CMD --key "tiktok_access_token"  --value "$TIKTOK_ACCESS_TOKEN"
    $MEMORY_CMD --key "tiktok_advertiser_id" --value "$TIKTOK_ADVERTISER_ID"
    echo "  ✅ Credentials stored"
  else
    echo "  ⚠️  TikTok Business API: connection failed (HTTP $HTTP_STATUS)"
  fi

  if [ -n "$TIKTOK_SHOP_TOKEN" ]; then
    $MEMORY_CMD --key "tiktok_shop_token" --value "$TIKTOK_SHOP_TOKEN"
    echo "  ✅ TikTok Shop token stored"
  fi
else
  echo "  ℹ️  Skipped — use manual CSV fallback until API is approved:"
  echo "     tiktok metrics import --file analytics.csv --type video"
  echo "     tiktok metrics import --file affiliate-report.csv --type shop"
fi

# ──────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setup Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test the full pipeline with one content package:"
echo ""
echo "  tiktok video generate ITER2-LED-A"
echo "  tiktok schedule ITER2-LED-A"
echo "  (wait for post to go live)"
echo "  tiktok metrics pull --content-id ITER2-LED-A --period 24h"
echo ""
echo "Or run the full campaign publish:"
echo ""
echo "  tiktok publish --campaign CAMP-20260528-001 --all"
echo ""
echo "Docs: plugins/ruflo-tiktok-affiliate/docs/api-integrations.md"
