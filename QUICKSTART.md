# Quick Start Guide

## Setup (2 minutes)

### 1. Set up your API keys

You already have a `.env.example` file with an Anthropic key. Create a proper `.env` file:

```bash
cp .env.example .env
```

Then edit `.env` and add your OpenAI key:

```
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=sk-ant-api03-... (already there)
```

### 2. Install dependencies (if not already done)

```bash
npm install
```

## Run Your First AI Team Session

Try this example:

```bash
npm start "build me a REST API for a blog with posts and comments"
```

The system will:
1. Analyst breaks down your requirements
2. Architect designs the system
3. Coder creates implementation plan
4. QA reviews everything for consistency
5. Lead Architect makes final approval/rejection

## What You'll See

The output will show:
- Each agent's step in the pipeline
- Token usage per agent
- Final APPROVED or REJECTED decision
- Complete deliverable or revision instructions

## Customize Agent Models

Edit `config/agents.config.json` to change which models each agent uses:

```json
{
  "analyst": {
    "model": "claude-3-5-sonnet-20241022",
    "provider": "anthropic"
  },
  "architect": {
    "model": "gpt-4o",
    "provider": "openai"
  }
  // ... etc
}
```

You can mix and match OpenAI and Claude models for different agents!

## Example Prompts to Try

### Architecture Planning
```bash
npm start "design a microservices architecture for an e-commerce platform"
```

### Feature Implementation
```bash
npm start "implement user authentication with JWT tokens"
```

### Code Review
```bash
npm start "review a database schema for a social media app"
```

### System Design
```bash
npm start "plan the tech stack for a real-time multiplayer game"
```

## Understanding the Output

### APPROVED Result
- All agents agreed the plan is solid
- You get a complete, validated deliverable
- Exit code: 0

### REJECTED Result
- Agents found inconsistencies or issues
- You get specific revision instructions
- Exit code: 1

## Next Steps

1. Try different prompts
2. Experiment with different model combinations
3. Observe how agents collaborate and review each other
4. Use the output as a starting point for your projects

## Need Help?

Check the full README.md for:
- Detailed architecture explanation
- Troubleshooting guide
- Future enhancement roadmap
- Project structure details
