# Claude Code <-> AgentDB Memory Bridge

> Use when: importing memories, searching across namespaces, or managing the memory bridge.

Claude Code's auto-memory (`~/.claude/projects/*/memory/*.md`) is bridged to AgentDB with ONNX vector embeddings for semantic search.

## MCP Tools

| Tool | Description |
|------|-------------|
| `memory_import_claude` | Import Claude Code memories into AgentDB with 384-dim ONNX embeddings. Use `allProjects: true` to import from ALL projects. |
| `memory_bridge_status` | Show bridge health — Claude files, AgentDB entries, SONA state, connection status |
| `memory_search_unified` | Semantic search across ALL namespaces (claude-memories, auto-memory, patterns, tasks, feedback) |

## Auto-Import on Session Start

The `SessionStart` hook automatically imports current project's memories into AgentDB. For manual import of all projects:

```bash
# Via MCP tool (from Claude Code)
memory_import_claude({ allProjects: true })

# Via helper hook (from terminal)
node .claude/helpers/auto-memory-hook.mjs import-all
```

## Unified Search

```bash
memory_search_unified({ query: "authentication security", limit: 5 })
# Results include source attribution: claude-code, auto-memory, or agentdb
```

## Intelligence Pipeline

| Component | Status | Details |
|-----------|--------|---------|
| ONNX Embeddings | Active | all-MiniLM-L6-v2, 384 dimensions |
| SONA Learning | Active | Pattern matching + trajectory recording |
| ReasoningBank | Active | Pattern storage with file persistence |
| AgentDB sql.js | Active | SQLite with vector_indexes table |
