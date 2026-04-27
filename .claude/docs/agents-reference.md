# Available Agents (60+ Types)

> Use when: selecting which agent type to spawn for a task.

## Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

## V3 Specialized Agents
`security-architect`, `security-auditor`, `memory-specialist`, `performance-engineer`

## @claude-flow/security Module
CVE remediation, input validation, path security:
- `InputValidator` — Zod-based validation at boundaries
- `PathValidator` — Path traversal prevention
- `SafeExecutor` — Command injection protection
- `PasswordHasher` — bcrypt hashing
- `TokenGenerator` — Secure token generation

## Token Optimizer (Agent Booster)
Integrates agentic-flow optimizations for 30-50% token reduction:
```typescript
import { getTokenOptimizer } from '@claude-flow/integration';
const optimizer = await getTokenOptimizer();

const ctx = await optimizer.getCompactContext("auth patterns");      // -32% tokens
await optimizer.optimizedEdit(file, old, new, "typescript");         // 352x faster
const config = optimizer.getOptimalConfig(agentCount);               // 100% success
```

| Feature | Token Savings |
|---------|---------------|
| ReasoningBank retrieval | -32% |
| Agent Booster edits | -15% |
| Cache (95% hit rate) | -10% |
| Optimal batch size | -20% |

## Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

## Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

## Performance & Optimization
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

## GitHub & Repository
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

## SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

## Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

## Testing & Validation
`tdd-london-swarm`, `production-validator`
