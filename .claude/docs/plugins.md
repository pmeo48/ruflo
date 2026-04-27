# Plugins (20 Available)

> Use when: installing, managing, or developing plugins.

Plugins are distributed via IPFS and managed with the CLI.

```bash
npx claude-flow@v3alpha plugins list
npx claude-flow@v3alpha plugins install @claude-flow/plugin-name
npx claude-flow@v3alpha plugins enable @claude-flow/plugin-name
npx claude-flow@v3alpha plugins disable @claude-flow/plugin-name
```

## Core Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| `@claude-flow/embeddings` | 3.0.0-alpha.1 | Vector embeddings with sql.js, HNSW, hyperbolic support |
| `@claude-flow/security` | 3.0.0-alpha.1 | Input validation, path security, CVE remediation |
| `@claude-flow/claims` | 3.0.0-alpha.8 | Claims-based authorization (check, grant, revoke, list) |
| `@claude-flow/neural` | 3.0.0-alpha.7 | Neural pattern training (SONA, MoE, EWC++) |
| `@claude-flow/plugins` | 3.0.0-alpha.1 | Plugin system core (manager, discovery, store) |
| `@claude-flow/performance` | 3.0.0-alpha.1 | Performance profiling and benchmarking |

## Integration Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| `@claude-flow/plugin-agentic-qe` | 3.0.0-alpha.4 | Agentic quality engineering integration |
| `@claude-flow/plugin-prime-radiant` | 0.1.5 | Prime Radiant intelligence integration |
| `@claude-flow/plugin-gastown-bridge` | 3.0.0-alpha.1 | Gastown bridge protocol integration |
| `@claude-flow/teammate-plugin` | 1.0.0-alpha.1 | Multi-agent teammate coordination |
| `@claude-flow/plugin-code-intelligence` | 0.1.0 | Advanced code analysis and intelligence |
| `@claude-flow/plugin-test-intelligence` | 0.1.0 | Intelligent test generation and gap analysis |
| `@claude-flow/plugin-perf-optimizer` | 0.1.0 | Performance optimization automation |
| `@claude-flow/plugin-neural-coordinator` | 0.1.0 | Neural network coordination across agents |
| `@claude-flow/plugin-cognitive-kernel` | 0.1.0 | Core cognitive processing kernel |
| `@claude-flow/plugin-quantum-optimizer` | 0.1.0 | Quantum-inspired optimization algorithms |
| `@claude-flow/plugin-hyperbolic-reasoning` | 0.1.0 | Hyperbolic space reasoning for hierarchical data |

## Domain-Specific Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| `@claude-flow/plugin-healthcare-clinical` | 0.1.0 | Healthcare clinical workflow automation |
| `@claude-flow/plugin-financial-risk` | 0.1.0 | Financial risk assessment and modeling |
| `@claude-flow/plugin-legal-contracts` | 0.1.0 | Legal contract analysis and generation |

## Plugin Development

```bash
npx claude-flow@v3alpha plugins create my-plugin
npx claude-flow@v3alpha plugins install ./path/to/my-plugin
npx claude-flow@v3alpha plugins publish
```

Registry source: IPFS via Pinata (`QmXbfEAaR7D2Ujm4GAkbwcGZQMHqAMpwDoje4583uNP834`)
