# V3 Hooks System (17 Hooks + 12 Workers)

> Use when: configuring hooks, dispatching background workers, or managing session lifecycle.

## Hook Categories

| Category | Hooks | Purpose |
|----------|-------|---------|
| **Core** | `pre-edit`, `post-edit`, `pre-command`, `post-command`, `pre-task`, `post-task` | Tool lifecycle |
| **Session** | `session-start`, `session-end`, `session-restore`, `notify` | Context management |
| **Intelligence** | `route`, `explain`, `pretrain`, `build-agents`, `transfer` | Neural learning |
| **Learning** | `intelligence` (trajectory-start/step/end, pattern-store/search, stats, attention) | Reinforcement |
| **Agent Teams** | `teammate-idle`, `task-completed` | Multi-agent coordination |

## 12 Background Workers

| Worker | Priority | Description |
|--------|----------|-------------|
| `ultralearn` | normal | Deep knowledge acquisition |
| `optimize` | high | Performance optimization |
| `consolidate` | low | Memory consolidation |
| `predict` | normal | Predictive preloading |
| `audit` | critical | Security analysis |
| `map` | normal | Codebase mapping |
| `preload` | low | Resource preloading |
| `deepdive` | normal | Deep code analysis |
| `document` | normal | Auto-documentation |
| `refactor` | normal | Refactoring suggestions |
| `benchmark` | normal | Performance benchmarking |
| `testgaps` | normal | Test coverage analysis |

## Essential Hook Commands

```bash
# Core hooks
npx claude-flow@v3alpha hooks pre-task --description "[task]"
npx claude-flow@v3alpha hooks post-task --task-id "[id]" --success true
npx claude-flow@v3alpha hooks post-edit --file "[file]" --train-patterns

# Session management
npx claude-flow@v3alpha hooks session-start --session-id "[id]"
npx claude-flow@v3alpha hooks session-end --export-metrics true
npx claude-flow@v3alpha hooks session-restore --session-id "[id]"

# Intelligence routing
npx claude-flow@v3alpha hooks route --task "[task]"
npx claude-flow@v3alpha hooks explain --topic "[topic]"

# Neural learning
npx claude-flow@v3alpha hooks pretrain --model-type moe --epochs 10
npx claude-flow@v3alpha hooks build-agents --agent-types coder,tester

# Background workers
npx claude-flow@v3alpha hooks worker list
npx claude-flow@v3alpha hooks worker dispatch --trigger audit
npx claude-flow@v3alpha hooks worker status
```
