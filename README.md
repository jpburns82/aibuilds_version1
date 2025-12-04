# AI Engineering Team - Multi-Agent Orchestrator

A local orchestrator app that routes user requests through a team of specialized AI agents for collaborative software engineering tasks.

## Overview

This system takes a user prompt and processes it through five specialized AI agents, each contributing their expertise:

1. **Analyst Agent** - Breaks down requirements, identifies ambiguities, defines acceptance criteria
2. **Architect Agent** - Designs system architecture, file structure, and data models
3. **Coder Agent** - Creates implementation plans and code sketches (MVP-focused)
4. **QA Agent** - Reviews all outputs for consistency and conflicts
5. **Lead Architect Agent** - Makes final APPROVE/REJECT decision with reasoning

## MVP Scope

This is a **pure reasoning + collaboration MVP**:
- Agents analyze, plan, and review
- No file writing or code execution
- No tool calling
- Focus on multi-agent orchestration and decision-making

## Features

- Multi-agent pipeline with specialized roles
- Cross-agent review and validation
- Support for both OpenAI and Claude models
- Configurable model assignment per agent
- Structured approval/rejection workflow
- Detailed logging of pipeline execution

## Installation

```bash
npm install
```

## Configuration

### 1. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Add your API keys to `.env`:

```
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2. Agent Configuration

Edit `config/agents.config.json` to customize which model each agent uses:

```json
{
  "analyst": {
    "model": "claude-3-5-sonnet-20241022",
    "provider": "anthropic"
  },
  "architect": {
    "model": "gpt-4o",
    "provider": "openai"
  },
  "coder": {
    "model": "gpt-4o",
    "provider": "openai"
  },
  "qa": {
    "model": "claude-3-5-sonnet-20241022",
    "provider": "anthropic"
  },
  "leadArchitect": {
    "model": "gpt-4o",
    "provider": "openai"
  }
}
```

## Usage

### Basic Command

```bash
npm start "your prompt here"
```

### Examples

#### Example 1: Build a Feature

```bash
npm start "build me a CRUD microservice for users"
```

#### Example 2: Review Code

```bash
npm start "review this authentication system design and suggest improvements"
```

#### Example 3: Plan a System

```bash
npm start "plan the architecture for a real-time chat application"
```

## Output Format

### If APPROVED:

```
 APPROVED  MVP architecture + code outline validated.

[Reasoning from Lead Architect]

FINAL DELIVERABLE:
[Combined outputs from all agents]
```

### If REJECTED:

```
 REJECTED  Issues detected that need resolution.

[Reasoning from Lead Architect]

REQUIRED FIXES:
1. [Specific fix needed]
2. [Specific fix needed]
...
```

## Project Structure

```
/project-root
  /src
    /agents              # AI agent implementations
      baseAgent.ts       # Base class for all agents
      analystAgent.ts
      architectAgent.ts
      coderAgent.ts
      qaAgent.ts
      leadArchitectAgent.ts
    /orchestrator        # Pipeline and routing logic
      pipeline.ts        # Main execution pipeline
      router.ts          # Agent routing logic
    /models              # TypeScript type definitions
      agentTypes.ts
      messageTypes.ts
    /utils               # Utility functions
      logger.ts          # Logging utility
      promptBuilder.ts   # Builds agent-specific prompts
      reviewCombiner.ts  # Combines and parses outputs
      env.ts             # Environment variable handling
    /clients             # API client implementations
      openaiClient.ts
      claudeClient.ts
  /config                # Configuration files
    agents.config.json   # Agent model assignments
    model.config.json    # Model provider settings
  /tests                 # Test files
  index.ts               # CLI entry point
  package.json
  tsconfig.json
  .env.example
  README.md
```

## How It Works

### Pipeline Flow

1. **User Input**: You provide a prompt via CLI
2. **Router**: Determines agent execution order (fixed for MVP: Analyst ’ Architect ’ Coder ’ QA ’ Lead)
3. **Agent Execution**: Each agent runs sequentially, building on previous outputs
4. **Context Building**: Each agent's output is added to the pipeline context
5. **Final Decision**: Lead Architect reviews all outputs and makes APPROVE/REJECT decision
6. **Output**: Formatted result is displayed to user

### Prompt Building

Each agent receives:
- Original user prompt
- Relevant outputs from previous agents
- Role-specific instructions

The `PromptBuilder` class constructs appropriate prompts for each agent role.

### Decision Parsing

The `ReviewCombiner` parses the Lead Architect's output to extract:
- Decision status (APPROVED/REJECTED)
- Reasoning
- Final deliverable (if approved)
- Revision instructions (if rejected)

## Development

### Run in Development Mode

```bash
npm run dev
```

### Build TypeScript

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## Future Enhancements (Beyond MVP)

- Persistent project memory
- File-writing capabilities
- Multi-run refinement cycles
- Agent "threads" per project
- Vector memory for context
- Web UI
- Tool calling support
- Code execution sandbox
- Integration with version control

## Troubleshooting

### Missing API Keys

If you see an error about missing environment variables:
1. Ensure `.env` file exists (copy from `.env.example`)
2. Add valid API keys for both OpenAI and Claude
3. Restart the application

### Model Not Found

If you get model errors:
1. Check `config/agents.config.json` for valid model names
2. Ensure you have access to the specified models
3. Update model names to match your API access

### Import Errors

If you encounter TypeScript import errors:
```bash
npm install
npm run build
```

## License

MIT

## Contributing

This is an MVP. Contributions welcome for:
- Additional agent roles
- Enhanced prompt engineering
- Better error handling
- Test coverage
- Documentation improvements
