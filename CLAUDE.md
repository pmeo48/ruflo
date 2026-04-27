# Claude Code Configuration - Ruflo v3.5

> **Ruflo v3.5** (2026-04-07) — Stable release with verified capabilities.
> 6,000+ commits, 314 MCP tools, 16 agent roles + custom types, 19 AgentDB controllers.
> Packages: `@claude-flow/cli@3.5.65`, `claude-flow@3.5.65`, `ruflo@3.5.65`

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- NEVER save to root folder — use the directories below
- Use `/src` for source code, `/tests` for tests, `/docs` for documentation
- Use `/config` for configuration, `/scripts` for utilities, `/examples` for examples

## Project Architecture

- Follow Domain-Driven Design with bounded contexts
- Keep files under 500 lines
- Use typed interfaces for all public APIs
- Prefer TDD London School (mock-first) for new code
- Use event sourcing for state changes
- Ensure input validation at system boundaries

### Key Packages

| Package | Path | Purpose |
|---------|------|---------|
| `@claude-flow/cli` | `v3/@claude-flow/cli/` | CLI entry point (26 commands) |
| `@claude-flow/codex` | `v3/@claude-flow/codex/` | Dual-mode Claude + Codex collaboration |
| `@claude-flow/guidance` | `v3/@claude-flow/guidance/` | Governance control plane |
| `@claude-flow/hooks` | `v3/@claude-flow/hooks/` | 17 hooks + 12 workers |
| `@claude-flow/memory` | `v3/@claude-flow/memory/` | AgentDB + HNSW search |
| `@claude-flow/security` | `v3/@claude-flow/security/` | Input validation, CVE remediation |

## Concurrency: 1 MESSAGE = ALL RELATED OPERATIONS

- All operations MUST be concurrent/parallel in a single message
- Use Claude Code's Task tool for spawning agents, not just MCP
- ALWAYS batch ALL todos in ONE TodoWrite call (5-10+ minimum)
- ALWAYS spawn ALL agents in ONE message with full instructions via Task tool
- ALWAYS batch ALL file reads/writes/edits in ONE message
- ALWAYS batch ALL terminal operations in ONE Bash message
- ALWAYS batch ALL memory store/retrieve operations in ONE message

## Claude Code vs MCP Tools

**Claude Code handles ALL EXECUTION:** Task tool (agents), file ops, code generation, Bash, git.
**MCP tools ONLY COORDINATE:** swarm init, agent types, task orchestration, memory, neural features.

Keep MCP for coordination strategy only — use Claude Code's Task tool for real execution.

## Critical Policies

### Integrity Rule (ABSOLUTE)
- NO shortcuts, fake data, or false claims
- ALWAYS implement properly, verify before claiming success
- ALWAYS use real database queries for integration tests
- ALWAYS run actual tests, not assume they pass

### Test Execution
- NEVER run `npm test` without `--run` flag (watch mode risk)
- Use: `npm test -- --run`, `npm run test:unit`, `npm run test:integration`

### Data Protection
- NEVER run `rm -f` on `.agentic-qe/` or `*.db` files without confirmation
- ALWAYS backup before database operations

### Git Operations
- NEVER auto-commit/push without explicit user request
- ALWAYS wait for user confirmation before git operations

## Quick Setup

```bash
claude mcp add claude-flow npx claude-flow@v3alpha mcp start
npx claude-flow@v3alpha daemon start
npx claude-flow@v3alpha doctor --fix
```

## Environment Variables

```bash
CLAUDE_FLOW_CONFIG=./claude-flow.config.json
CLAUDE_FLOW_LOG_LEVEL=info
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
CLAUDE_FLOW_MCP_PORT=3000
CLAUDE_FLOW_MCP_TRANSPORT=stdio
CLAUDE_FLOW_MEMORY_BACKEND=hybrid
CLAUDE_FLOW_MEMORY_PATH=./data/memory
```

---

## Detailed Instructions (Helper Files)

Read these files from `.claude/docs/` when you need the specific topic. Each file starts with a "Use when" line explaining when it's relevant.

| File | When to Read |
|------|-------------|
| [Swarm Orchestration](.claude/docs/swarm-orchestration.md) | Spawning multi-agent swarms, dual-mode collaboration, auto-start protocol, anti-drift config, agent routing |
| [CLI Reference](.claude/docs/cli-reference.md) | Running CLI commands, using headless `claude -p` instances, CLI flags reference |
| [Agent Teams](.claude/docs/agent-teams.md) | Setting up Agent Teams, coordinating teammates, inter-agent messaging |
| [Hooks & Workers](.claude/docs/hooks-workers.md) | Configuring hooks, dispatching background workers, session lifecycle |
| [Intelligence System](.claude/docs/intelligence-system.md) | RuVector, SONA, embeddings, hive-mind consensus, performance targets |
| [Publishing](.claude/docs/publishing.md) | Publishing npm packages, updating dist-tags, IPFS plugin registry management |
| [Agents Reference](.claude/docs/agents-reference.md) | Selecting which agent type to spawn, token optimizer, security module |
| [Memory Bridge](.claude/docs/memory-bridge.md) | AgentDB memory bridge, importing memories, unified search across namespaces |
| [Agentic QE](.claude/docs/agentic-qe.md) | Test generation, coverage analysis, quality assessment, QE MCP tools |
| [Plugins](.claude/docs/plugins.md) | Installing, managing, or developing plugins (20 available) |
| [V3 Agents Index](.claude/docs/v3-agents-index.md) | Full index of V3 QE agent definitions in `.claude/agents/v3/` |

---

Remember: **Claude Flow coordinates, Claude Code creates!**
