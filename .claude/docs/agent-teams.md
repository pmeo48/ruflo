# Agent Teams (Multi-Agent Coordination)

> Use when: setting up Agent Teams, coordinating teammates, or managing multi-agent workflows.

Claude Code's experimental Agent Teams feature is fully integrated with Claude Flow for advanced multi-agent coordination.

## Enabling Agent Teams

Automatically enabled via `npx claude-flow@v3alpha init`. Config in `.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "claudeFlow": {
    "agentTeams": {
      "enabled": true,
      "teammateMode": "auto",
      "taskListEnabled": true,
      "mailboxEnabled": true
    }
  }
}
```

## Components

| Component | Tool | Purpose |
|-----------|------|---------|
| **Team Lead** | You (main Claude) | Coordinates teammates, assigns tasks, reviews results |
| **Teammates** | `Task` tool | Sub-agents spawned to work on specific tasks |
| **Task List** | `TaskCreate/TaskList/TaskUpdate` | Shared todo list visible to all team members |
| **Mailbox** | `SendMessage` | Inter-agent messaging for coordination |

## Creating and Managing Teams

```javascript
TeamCreate({
  team_name: "feature-dev",
  description: "Building new feature",
  agent_type: "coordinator"
})

TaskCreate({ subject: "Design API", description: "...", activeForm: "Designing" })
TaskCreate({ subject: "Implement endpoints", description: "...", activeForm: "Implementing" })
TaskCreate({ subject: "Write tests", description: "...", activeForm: "Testing" })

Task({
  prompt: "Design the API according to task #1...",
  subagent_type: "system-architect",
  team_name: "feature-dev",
  name: "architect",
  run_in_background: true
})
Task({
  prompt: "Implement endpoints from task #2...",
  subagent_type: "coder",
  team_name: "feature-dev",
  name: "developer",
  run_in_background: true
})
```

## Agent Teams Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| `TeammateIdle` | Teammate finishes turn | Auto-assign pending tasks to idle teammates |
| `TaskCompleted` | Task marked complete | Train patterns from successful work, notify lead |

```bash
npx claude-flow@v3alpha hooks teammate-idle --auto-assign true
npx claude-flow@v3alpha hooks task-completed -i task-123 --train-patterns true
```

## Inter-Agent Communication

```javascript
// Send message to teammate
SendMessage({
  type: "message",
  recipient: "developer",
  content: "Please prioritize the auth endpoint",
  summary: "Prioritize auth"
})

// Shutdown teammate gracefully
SendMessage({
  type: "shutdown_request",
  recipient: "developer",
  content: "Work complete, shutting down"
})
```

## Best Practices

1. **Spawn teammates in background**: Use `run_in_background: true` for parallel work
2. **Create tasks first**: Use TaskCreate before spawning teammates so they have work
3. **Use descriptive names**: Name teammates by role (architect, developer, tester)
4. **Don't poll status**: Wait for teammates to message back or complete
5. **Graceful shutdown**: Always send shutdown_request before TeamDelete
6. **Clean up**: Use TeamDelete after all teammates have shut down

## Teammate Display Modes

| Mode | Description |
|------|-------------|
| `auto` | Automatically selects best mode for environment |
| `in-process` | Teammates run in same process (default for CI/background) |
| `tmux` | Split-pane display in terminal (requires tmux) |
