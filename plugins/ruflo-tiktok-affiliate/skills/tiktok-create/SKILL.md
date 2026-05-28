---
name: tiktok-create
description: Generate a complete TikTok content package for an affiliate product — script, caption, hooks, and hashtags
argument-hint: "<product-id> [--format ugc|hook-story-cta|unboxing|transformation|comparison|tutorial] [--variants 2]"
allowed-tools: Bash mcp__claude-flow__memory_store mcp__claude-flow__memory_search mcp__claude-flow__memory_retrieve mcp__claude-flow__embeddings_generate
---

# TikTok Create

Generate a complete ready-to-shoot TikTok content package for an affiliate product, including video script, hook options, caption, and hashtag set.

## When to use

When you have a specific product to promote and need fully produced content — either standalone or as part of a campaign workflow.

## Parameters

- `<product-id>` — product ID from discovery results (required)
- `--format <type>` — content format: `ugc`, `hook-story-cta`, `unboxing`, `transformation`, `comparison`, `tutorial` (default: auto-select based on niche)
- `--variants <n>` — number of content variants to generate (default: 2)
- `--hook-style <style>` — hook angle: `pain-point`, `desire`, `social-proof`, `curiosity` (default: auto)
- `--duration <s>` — target video duration in seconds (default: 45)

## Steps

1. **Retrieve product data** — fetch from memory namespace `tiktok-affiliate` using the product-id

2. **Retrieve strategy** (if exists) — check `tiktok-strategy` namespace for an existing content strategy for this product

3. **Select format** — if `--format` not specified, auto-select the highest-CVR format for the product's niche based on the format performance table

4. **Generate hooks** — write 5 hook options using the selected hook style. Evaluate each against the hook quality checklist and select the strongest one.

5. **Write the script** — produce a word-for-word shooting script with:
   - Hook scene (0–3s): hook text + camera direction
   - Setup scene (3–15s): problem/desire setup + B-roll suggestion
   - Reveal scene (15–25s): product introduction + demo direction
   - Proof scene (25–40s): reviews/results + visual direction
   - CTA scene (40–45s): call-to-action + link placement instruction

6. **Write the caption** — hook sentence + 2 value lines + CTA line + hashtags

7. **Build hashtag set** — 3 primary niche tags, 5 secondary mid-tier tags, 2 CTA tags

8. **List B-roll shots** — 5 specific shot ideas matching the script scenes

9. **Store content package** — persist to `tiktok-content` namespace with key `content-PRODUCT_ID-VARIANT-YYYYMMDD`

10. **Display output**:
    ```
    Content Package — [PRODUCT_NAME] — Variant A
    ─────────────────────────────────────────────
    FORMAT: [format]
    SELECTED HOOK: "[hook text]"

    SCRIPT
    [0:00–0:03] HOOK
    "[hook text]"
    🎥 Direction: [camera direction]

    [0:03–0:15] SETUP
    "[setup text]"
    🎥 Direction: [b-roll direction]

    [continues...]

    CAPTION
    [caption text with hashtags]

    B-ROLL LIST
    1. [shot description]
    ...
    ```

## CLI alternative

```bash
npx @claude-flow/cli@latest memory retrieve \
  --namespace tiktok-content \
  --key "content-PRODUCT_ID-A-YYYYMMDD"
```

## Notes

- Always generate at least 2 variants for A/B testing — variant A uses the primary hook, variant B uses the second-strongest hook
- Content packages are automatically picked up by performance-analyst for tracking when running in campaign mode
- Recommended max 3 hashtags over 100M views to avoid suppression algorithm
