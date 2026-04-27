# Swarm Orchestration

> Use when: spawning multi-agent swarms, dual-mode collaboration, or complex tasks requiring coordination.

## Core Rules

- MUST initialize the swarm using MCP tools when starting complex tasks
- MUST spawn concurrent agents using Claude Code's Task tool
- Never use MCP tools alone for execution — Task tool agents do the actual work
- MUST call MCP tools AND Task tool in ONE message for complex work
- Always call MCP first, then IMMEDIATELY call Task tool to spawn agents

## 3-Tier Model Routing (ADR-026)

| Tier | Handler | Latency | Cost | Use Cases |
|------|---------|---------|------|-----------|
| **1** | Agent Booster (WASM) | <1ms | $0 | Simple transforms (var->const, add types, etc.) — **Skip LLM entirely** |
| **2** | Haiku | ~500ms | $0.0002 | Simple tasks, low complexity (<30%) |
| **3** | Sonnet/Opus | 2-5s | $0.003-0.015 | Complex reasoning, architecture, security (>30%) |

- Always check for `[AGENT_BOOSTER_AVAILABLE]` or `[TASK_MODEL_RECOMMENDATION]` before spawning agents
- Use Edit tool directly when `[AGENT_BOOSTER_AVAILABLE]` — intent types: `var-to-const`, `add-types`, `add-error-handling`, `async-await`, `add-logging`, `remove-console`

## Anti-Drift Coding Swarm (PREFERRED DEFAULT)

- ALWAYS use hierarchical topology for coding swarms
- Keep maxAgents at 6-8 for tight coordination
- Use specialized strategy for clear role boundaries
- Use `raft` consensus for hive-mind (leader maintains authoritative state)
- Run frequent checkpoints via `post-task` hooks
- Keep shared memory namespace for all agents
- Keep task cycles short with verification gates

```javascript
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})
```

## Auto-Start Swarm Protocol

When the user requests a complex task (multi-file changes, feature implementation, refactoring), **immediately execute this pattern in a SINGLE message:**

```javascript
// STEP 1: Initialize swarm coordination via MCP (in parallel with agent spawning)
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})

// STEP 2: Spawn agents concurrently using Claude Code's Task tool
// ALL Task calls MUST be in the SAME message for parallel execution
Task("Coordinator", "You are the swarm coordinator. Initialize session, coordinate other agents via memory. Run: npx claude-flow@v3alpha hooks session-start", "hierarchical-coordinator")
Task("Researcher", "Analyze requirements and existing code patterns. Store findings in memory via hooks.", "researcher")
Task("Architect", "Design implementation approach based on research. Document decisions in memory.", "system-architect")
Task("Coder", "Implement the solution following architect's design. Coordinate via hooks.", "coder")
Task("Tester", "Write tests for the implementation. Report coverage via hooks.", "tester")
Task("Reviewer", "Review code quality and security. Document findings.", "reviewer")

// STEP 3: Batch all todos
TodoWrite({ todos: [
  {content: "Initialize swarm coordination", status: "in_progress", activeForm: "Initializing swarm"},
  {content: "Research and analyze requirements", status: "in_progress", activeForm: "Researching requirements"},
  {content: "Design architecture", status: "pending", activeForm: "Designing architecture"},
  {content: "Implement solution", status: "pending", activeForm: "Implementing solution"},
  {content: "Write tests", status: "pending", activeForm: "Writing tests"},
  {content: "Review and finalize", status: "pending", activeForm: "Reviewing code"}
]})

// STEP 4: Store swarm state in memory
mcp__claude-flow__memory_usage({
  action: "store",
  namespace: "swarm",
  key: "current-session",
  value: JSON.stringify({task: "[user's task]", agents: 6, startedAt: new Date().toISOString()})
})
```

## Agent Routing (Anti-Drift)

| Code | Task | Agents |
|------|------|--------|
| 1 | Bug Fix | coordinator, researcher, coder, tester |
| 3 | Feature | coordinator, architect, coder, tester, reviewer |
| 5 | Refactor | coordinator, architect, coder, reviewer |
| 7 | Performance | coordinator, perf-engineer, coder |
| 9 | Security | coordinator, security-architect, auditor |
| 11 | Memory | coordinator, memory-specialist, perf-engineer |
| 13 | Docs | researcher, api-docs |

**Codes 1-11: hierarchical/specialized (anti-drift). Code 13: mesh/balanced**

## Task Complexity Detection

**AUTO-INVOKE SWARM when task involves:**
- Multiple files (3+)
- New feature implementation
- Refactoring across modules
- API changes with tests
- Security-related changes
- Performance optimization
- Database schema changes

**SKIP SWARM for:**
- Single file edits
- Simple bug fixes (1-2 lines)
- Documentation updates
- Configuration changes
- Quick questions/exploration

## Project Configuration (Anti-Drift Defaults)

- **Topology**: hierarchical (prevents drift via central coordination)
- **Max Agents**: 8 (smaller team = less drift)
- **Strategy**: specialized (clear roles, no overlap)
- **Consensus**: raft (leader maintains authoritative state)
- **Memory Backend**: hybrid (SQLite + AgentDB)
- **HNSW Indexing**: Enabled (150x-12,500x faster)
- **Neural Learning**: Enabled (SONA)

## Dual-Mode Collaboration (Claude Code + Codex)

This repository uses **dual-mode orchestration** to run Claude Code and OpenAI Codex workers in parallel with shared memory coordination.

### Dual-Mode Swarm Protocol

```javascript
// STEP 1: Initialize dual-mode swarm
mcp__ruv-swarm__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})

// STEP 2: Spawn BOTH platforms in parallel via Task tool
// Claude Code workers (architecture, security, testing)
Task("Architect", "Design the implementation. Store design in memory namespace 'collaboration'.", "system-architect")
Task("Tester", "Write tests based on architect's design. Read from 'collaboration' namespace.", "tester")
Task("Reviewer", "Review code quality and security. Store findings in 'collaboration'.", "reviewer")

// Codex workers (implementation, optimization)
Bash("npx claude-flow-codex dual run --worker 'codex:coder:Implement the solution based on architect design' --namespace collaboration")
Bash("npx claude-flow-codex dual run --worker 'codex:optimizer:Optimize performance based on implementation' --namespace collaboration")

// STEP 3: Coordinate via shared memory
Bash("npx claude-flow@v3alpha memory store --namespace collaboration --key 'task-context' --value '[task description]'")
```

### Collaboration Templates

| Template | Workers | Pipeline |
|----------|---------|----------|
| `feature` | Architect -> Coder -> Tester -> Reviewer | Full feature development |
| `security` | Analyst -> Scanner -> Reporter | Security audit workflow |
| `refactor` | Architect -> Refactorer -> Tester | Code modernization |
| `bugfix` | Researcher -> Coder -> Tester | Bug investigation & fix |

### CLI Commands

```bash
npx claude-flow-codex dual run feature --task "Add user authentication with OAuth"
npx claude-flow-codex dual run security --target "./src"
npx claude-flow-codex dual run refactor --target "./src/legacy"
npx claude-flow-codex dual status
npx claude-flow-codex dual templates
```

### Worker Dependency Levels

```
Level 0: [Architect]           # No dependencies - runs first
Level 1: [Coder, Tester]      # Depends on Architect
Level 2: [Reviewer]            # Depends on Coder + Tester
Level 3: [Optimizer]           # Depends on Reviewer approval
```

### Platform Strengths

| Task Type | Preferred Platform | Reason |
|-----------|-------------------|--------|
| Architecture & Design | Claude | Strong reasoning, system thinking |
| Implementation | Codex | Fast code generation |
| Security Review | Claude | Careful analysis, threat modeling |
| Performance Optimization | Codex | Code-level optimizations |
| Testing Strategy | Claude | Coverage analysis, edge cases |
| Refactoring | Codex | Bulk code transformations |

### Programmatic API

```typescript
import { DualModeOrchestrator, CollaborationTemplates } from '@claude-flow/codex';

const orchestrator = new DualModeOrchestrator({
  namespace: 'my-feature',
  memoryBackend: 'hybrid'
});

const workers = CollaborationTemplates.featureDevelopment('Add OAuth login');
const results = await orchestrator.runCollaboration(workers, 'Implement OAuth feature');
const designDocs = await orchestrator.getMemory('design-decisions');
```

### Shared Memory Coordination

```bash
npx claude-flow@v3alpha memory store --namespace collaboration --key "design-decisions" --value "..."
npx claude-flow@v3alpha memory search --namespace collaboration --query "authentication patterns"
npx claude-flow@v3alpha memory retrieve --namespace collaboration --key "security-findings"
```

### Cross-Platform Learning

```bash
npx claude-flow@v3alpha hooks post-task --task-id "dual-[id]" --success true --train-neural true
npx claude-flow@v3alpha memory store --namespace patterns --key "dual-mode-[pattern]" --value "[what worked]"
npx claude-flow@v3alpha hooks transfer store --pattern "dual-collab-success"
```
