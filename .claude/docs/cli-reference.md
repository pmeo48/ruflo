# V3 CLI Reference (26 Commands, 140+ Subcommands)

> Use when: running CLI commands, spawning agents/swarms from terminal, or using headless background instances.

## Core Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `init` | 4 | Project initialization with wizard, presets, skills, hooks |
| `agent` | 8 | Agent lifecycle (spawn, list, status, stop, metrics, pool, health, logs) |
| `swarm` | 6 | Multi-agent swarm coordination and orchestration |
| `memory` | 11 | AgentDB memory with vector search (150x-12,500x faster) |
| `mcp` | 9 | MCP server management and tool execution |
| `task` | 6 | Task creation, assignment, and lifecycle |
| `session` | 7 | Session state management and persistence |
| `config` | 7 | Configuration management and provider setup |
| `status` | 3 | System status monitoring with watch mode |
| `start` | 3 | Service startup and quick launch |
| `workflow` | 6 | Workflow execution and template management |
| `hooks` | 17 | Self-learning hooks + 12 background workers |
| `hive-mind` | 6 | Queen-led Byzantine fault-tolerant consensus |

## Advanced Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `daemon` | 5 | Background worker daemon (start, stop, status, trigger, enable) |
| `neural` | 5 | Neural pattern training (train, status, patterns, predict, optimize) |
| `security` | 6 | Security scanning (scan, audit, cve, threats, validate, report) |
| `performance` | 5 | Performance profiling (benchmark, profile, metrics, optimize, report) |
| `providers` | 5 | AI providers (list, add, remove, test, configure) |
| `plugins` | 5 | Plugin management (list, install, uninstall, enable, disable) |
| `deployment` | 5 | Deployment management (deploy, rollback, status, environments, release) |
| `embeddings` | 4 | Vector embeddings (embed, batch, search, init) - 75x faster with agentic-flow |
| `claims` | 4 | Claims-based authorization (check, grant, revoke, list) |
| `migrate` | 5 | V2 to V3 migration with rollback support |
| `process` | 4 | Background process management |
| `doctor` | 1 | System diagnostics with health checks |
| `completions` | 4 | Shell completions (bash, zsh, fish, powershell) |

## Quick CLI Examples

```bash
npx claude-flow@v3alpha init --wizard
npx claude-flow@v3alpha daemon start
npx claude-flow@v3alpha agent spawn -t coder --name my-coder
npx claude-flow@v3alpha swarm init --v3-mode
npx claude-flow@v3alpha memory search -q "authentication patterns"
npx claude-flow@v3alpha doctor --fix
npx claude-flow@v3alpha security scan --depth full
npx claude-flow@v3alpha performance benchmark --suite all
```

## Headless Background Instances (claude -p)

Use `claude -p` (print/pipe mode) to spawn headless Claude instances for parallel background work.

### Basic Usage

```bash
claude -p "Analyze the authentication module for security issues"
claude -p --model haiku "Format this config file"
claude -p --model opus "Design the database schema for user management"
claude -p --output-format json "List all TODO comments in src/"
claude -p --max-budget-usd 0.50 "Run comprehensive security audit"
claude -p --allowedTools "Read,Grep,Glob" "Find all files that import the auth module"
claude -p --dangerously-skip-permissions "Fix all lint errors in src/"
```

### Parallel Background Execution

```bash
claude -p "Analyze src/auth/ for vulnerabilities" &
claude -p "Write tests for src/api/endpoints.ts" &
claude -p "Review src/models/ for performance issues" &
wait

SECURITY=$(claude -p "Security audit of auth module" &)
TESTS=$(claude -p "Generate test coverage report" &)
PERF=$(claude -p "Profile memory usage in workers" &)
wait
echo "$SECURITY" "$TESTS" "$PERF"
```

### Session Continuation

```bash
claude -p --session-id "abc-123" "Start analyzing the codebase"
claude -p --resume "abc-123" "Continue with the test files"
claude -p --resume "abc-123" --fork-session "Try approach A: event sourcing"
claude -p --resume "abc-123" --fork-session "Try approach B: CQRS pattern"
```

### Key Flags

| Flag | Purpose |
|------|---------|
| `-p, --print` | Non-interactive mode, print and exit |
| `--model <model>` | Select model (haiku, sonnet, opus) |
| `--output-format <fmt>` | Output: text, json, stream-json |
| `--max-budget-usd <amt>` | Spending cap per invocation |
| `--allowedTools <tools>` | Restrict available tools |
| `--append-system-prompt` | Add custom instructions |
| `--resume <id>` | Continue a previous session |
| `--fork-session` | Branch from resumed session |
| `--fallback-model <model>` | Auto-fallback if primary overloaded |
| `--permission-mode <mode>` | acceptEdits, bypassPermissions, plan, etc. |
| `--mcp-config <json>` | Load MCP servers from JSON |
