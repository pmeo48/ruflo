/**
 * ADR-091 Phase 1 -- Runtime Capabilities Detection
 *
 * Detects the host environment and exposes which execution primitives are
 * available so that higher-level services can choose the right path:
 *   1. claude-code-native  -- full Claude Code tooling (loop, monitor, cron, teams)
 *   2. mcp-fallback        -- MCP transport active but native tools missing
 *   3. ci-daemon           -- headless / CI, use detached daemon
 */

export interface RuntimeCapabilities {
  loop: boolean;
  monitor: boolean;
  cron: boolean;
  teams: boolean;
  worktreeIsolation: boolean;
  pushNotification: boolean;
}

export type RuntimeTier = 'claude-code-native' | 'mcp-fallback' | 'ci-daemon';

function isClaudeCodeNative(): boolean {
  return !!(
    process.env.CLAUDE_CODE ||
    process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
  );
}

function isMcpTransportActive(): boolean {
  return (
    !process.stdin.isTTY &&
    process.env.CLAUDE_FLOW_MCP_TRANSPORT === 'stdio'
  );
}

function isCiOrHeadless(): boolean {
  return !!(process.env.CI || process.env.CLAUDE_FLOW_HEADLESS);
}

export function detectCapabilities(): RuntimeCapabilities {
  const native = isClaudeCodeNative();
  const teamsEnabled = !!process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;

  return {
    loop: native,
    monitor: native,
    cron: native,
    teams: native && teamsEnabled,
    worktreeIsolation: native,
    pushNotification: native,
  };
}

export function getRuntimeTier(): RuntimeTier {
  if (isClaudeCodeNative()) return 'claude-code-native';
  if (isMcpTransportActive()) return 'mcp-fallback';
  if (isCiOrHeadless()) return 'ci-daemon';
  return 'mcp-fallback';
}

export function getCacheWarmDelay(providerCacheTtlSeconds?: number): number {
  return Math.min(270, (providerCacheTtlSeconds ?? 300) * 0.9);
}
