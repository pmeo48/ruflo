---
name: tiktok-campaign
description: Launch and autonomously manage a complete TikTok Shop affiliate marketing campaign with all 5 agents
argument-hint: "<goal> [--niches beauty,home] [--budget 500] [--duration 14] [--iterations 5]"
allowed-tools: Bash Task mcp__claude-flow__memory_store mcp__claude-flow__memory_search mcp__claude-flow__memory_retrieve mcp__claude-flow__swarm_init mcp__claude-flow__task_orchestrate mcp__claude-flow__embeddings_generate
---

# TikTok Campaign

Launch a fully autonomous TikTok Shop affiliate marketing campaign. The campaign-orchestrator coordinates all five agents in a self-improving loop: discover → strategize → create → track → optimize → repeat.

## When to use

When you want to start a complete autonomous affiliate marketing campaign, not just a single skill. This is the entry point for the full multi-agent system.

## Parameters

- `<goal>` — campaign goal description, e.g. "Generate $2,000 GMV from beauty products in 14 days"
- `--niches <list>` — comma-separated niches to target (default: `beauty,home,fashion`)
- `--budget <usd>` — optional boosting budget (default: 0 — organic only)
- `--duration <days>` — campaign duration in days (default: 14)
- `--iterations <n>` — max discovery+create cycles (default: 5)
- `--interval <hours>` — hours between iterations (default: 48)
- `--min-commission <pct>` — minimum product commission rate (default: 10)
- `--target-gmv <usd>` — GMV goal for auto-stop on success (optional)
- `--dry-run` — plan the campaign without executing it

## Steps

1. **Create campaign record** — generate a unique campaign ID and store campaign configuration in `tiktok-campaigns` memory namespace

2. **Initialize swarm** — call `mcp__claude-flow__swarm_init` with hierarchical topology:
   ```json
   {"topology": "hierarchical", "maxAgents": 6, "strategy": "specialized"}
   ```

3. **Spawn all 5 agents** in a single message (background):
   - `product-scout` — "Await discovery task from campaign-orchestrator [ID]"
   - `content-strategist` — "Await strategy task from campaign-orchestrator [ID]"
   - `content-creator` — "Await content generation task from campaign-orchestrator [ID]"
   - `performance-analyst` — "Await tracking setup from campaign-orchestrator [ID]. Track all content IDs provided."
   - `campaign-orchestrator` — "Run autonomous campaign [ID] with config: [CAMPAIGN_CONFIG_JSON]"

4. **Kick off iteration 1** — send the first discovery task to product-scout:
   ```
   SendMessage to "product-scout": "Campaign [ID] iteration 1. Discover top 10 hot products in [NICHES]. Min score 0.65, commission ≥ [MIN_COMMISSION]%."
   ```

5. **Monitor campaign** — display live status as agents report back. Refresh every 30s if in watch mode (`--watch` flag).

6. **Display campaign launch confirmation**:
   ```
   Campaign Launched — [CAMPAIGN_ID]
   ────────────────────────────────────
   Goal:       [goal text]
   Niches:     [niches]
   Duration:   [N] days ([N] iterations)
   Interval:   [N]h between iterations
   Budget:     $[X] ([organic/boosted])
   Status:     🟢 Active — Iteration 1 running

   AGENTS
   🔍 product-scout      → discovering trending products
   🎯 content-strategist → waiting
   ✍️ content-creator     → waiting
   📊 performance-analyst → ready to track
   🎛️ campaign-orchestrator → coordinating

   Track progress: /tiktok-track --campaign [CAMPAIGN_ID]
   Pause:          /tiktok campaign pause [CAMPAIGN_ID]
   ────────────────────────────────────
   ```

## CLI alternative

```bash
# Check campaign status after launch
npx @claude-flow/cli@latest memory retrieve \
  --namespace tiktok-campaigns \
  --key "campaign-CAMPAIGN_ID"
```

## Dry-run mode

With `--dry-run`, the skill outputs:
- Campaign configuration plan
- Expected product discovery output (estimated based on niche trends)
- Sample content strategy for top product type
- Projected KPI ranges based on historical benchmarks
- Full iteration schedule

No agents are spawned and no memory is written.

## Notes

- The campaign runs autonomously — you do NOT need to stay active. Agents communicate via SendMessage and schedule their own wake-ups.
- Each iteration takes approximately 2–4 hours (discovery → strategy → content creation → initial metrics)
- The campaign-orchestrator will message you when iteration milestones complete or if action is needed
- To watch real-time: `/tiktok-track --campaign [ID]` or check `tiktok campaign status [ID]`
