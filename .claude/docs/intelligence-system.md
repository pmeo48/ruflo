# Intelligence System & Performance

> Use when: working with RuVector, SONA, embeddings, hive-mind consensus, or performance optimization.

## RuVector Intelligence System

- **SONA**: Self-Optimizing Neural Architecture (<0.05ms adaptation)
- **MoE**: Mixture of Experts for specialized routing
- **HNSW**: 150x-12,500x faster pattern search
- **EWC++**: Elastic Weight Consolidation (prevents forgetting)
- **Flash Attention**: 2.49x-7.47x speedup

### 4-Step Intelligence Pipeline

1. **RETRIEVE** — Fetch relevant patterns via HNSW
2. **JUDGE** — Evaluate with verdicts (success/failure)
3. **DISTILL** — Extract key learnings via LoRA
4. **CONSOLIDATE** — Prevent catastrophic forgetting via EWC++

## Embeddings Package (v3.0.0-alpha.12)

- **sql.js**: Cross-platform SQLite persistent cache (WASM, no native compilation)
- **Document chunking**: Configurable overlap and size
- **Normalization**: L2, L1, min-max, z-score
- **Hyperbolic embeddings**: Poincare ball model for hierarchical data
- **75x faster**: With agentic-flow ONNX integration
- **Neural substrate**: Integration with RuVector

## Hive-Mind Consensus

### Topologies
- `hierarchical` — Queen controls workers directly
- `mesh` — Fully connected peer network
- `hierarchical-mesh` — Hybrid (recommended)
- `adaptive` — Dynamic based on load

### Consensus Strategies
- `byzantine` — BFT (tolerates f < n/3 faulty)
- `raft` — Leader-based (tolerates f < n/2)
- `gossip` — Epidemic for eventual consistency
- `crdt` — Conflict-free replicated data types
- `quorum` — Configurable quorum-based

## V3 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| HNSW Search | 150x-12,500x faster | **Implemented** (persistent) |
| Memory Reduction | 50-75% with quantization | **Implemented** (3.92x Int8) |
| SONA Integration | Pattern learning | **Implemented** (ReasoningBank) |
| Flash Attention | 2.49x-7.47x speedup | In progress |
| MCP Response | <100ms | Achieved |
| CLI Startup | <500ms | Achieved |
| SONA Adaptation | <0.05ms | In progress |
