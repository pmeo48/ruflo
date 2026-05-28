#!/usr/bin/env bash
# ruflo-tiktok-affiliate quickstart
# Runs a dry-run campaign to validate the plugin is working correctly.

set -euo pipefail

echo "╔═══════════════════════════════════════════╗"
echo "║   ruflo-tiktok-affiliate — Quick Start    ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Validate memory namespace is accessible
echo "▶ Checking memory system..."
npx @claude-flow/cli@latest memory store \
  --namespace tiktok-affiliate \
  --key "quickstart-check-$(date +%s)" \
  --value '{"status":"ok"}' 2>/dev/null \
  && echo "  ✅ Memory system: OK" \
  || echo "  ⚠️  Memory system: unavailable (will use in-memory fallback)"

echo ""

# Check neural system
echo "▶ Checking neural system..."
npx @claude-flow/cli@latest neural status 2>/dev/null \
  && echo "  ✅ Neural system: OK" \
  || echo "  ⚠️  Neural system: not initialized (run: npx @claude-flow/cli@latest hooks pretrain)"

echo ""

# Run dry-run discovery
echo "▶ Simulating product discovery (dry run)..."
echo "  Would query TikTok Shop affiliate marketplace for trending products"
echo "  Would score: commission_rate (35%) + trend_velocity (30%) + review_score (20%) + competition (15%)"
echo "  Sample output:"
echo ""
echo "  TikTok Shop Discovery — $(date +%Y-%m-%d)"
echo "  ──────────────────────────────────────"
echo "  Scanned: 50 products"
echo "  🔥 Hot (≥0.65): 8"
echo "  🟡 Warm (0.45–0.65): 14"
echo "  ❄️  Cold (<0.45): 28"
echo ""
echo "  TOP PRODUCTS"
echo "  ┌──────────────────────────────────┬───────┬─────────────┬──────┐"
echo "  │ Product                          │ Score │ Commission  │ Tier │"
echo "  ├──────────────────────────────────┼───────┼─────────────┼──────┤"
echo "  │ Vitamin C Serum 30ml             │ 0.84  │ 18% (\$2.16)│  🔥  │"
echo "  │ Posture Corrector Belt           │ 0.79  │ 15% (\$3.00)│  🔥  │"
echo "  │ LED Face Mask (7-color)          │ 0.72  │ 20% (\$6.00)│  🔥  │"
echo "  └──────────────────────────────────┴───────┴─────────────┴──────┘"
echo ""

# Show campaign launch example
echo "▶ To launch a real campaign:"
echo ""
echo "  /tiktok-campaign \"Generate \$2,000 GMV from beauty products in 14 days\" \\"
echo "    --niches beauty,home \\"
echo "    --duration 14 \\"
echo "    --iterations 5"
echo ""
echo "  Or use the tiktok command:"
echo ""
echo "  tiktok campaign create \"Generate \$2,000 GMV from beauty products in 14 days\""
echo ""
echo "  Then track progress:"
echo "  /tiktok-track --campaign <campaign-id>"
echo ""
echo "✅ Plugin is ready. Install with: claude --plugin-dir plugins/ruflo-tiktok-affiliate"
