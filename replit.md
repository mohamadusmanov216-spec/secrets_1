# Fitness Bot with Mastra & Telegram

## Overview

This is a fitness coaching bot built using the Mastra framework that integrates with Telegram. The bot provides fitness guidance, nutrition advice, and coaching services through an interactive menu system. It's designed to help users with muscle building, weight loss, sports nutrition information, primarily serving a Russian and Chechen-speaking audience.

The application uses Mastra's workflow orchestration (no AI required) combined with Telegram webhook triggers to create an interactive menu-driven bot experience. The architecture leverages Mastra's workflow capabilities and Inngest for durable execution.

**Last Updated**: November 9, 2025
**Current Implementation**: Menu-based navigation without AI (no OpenAI API key required)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **No traditional frontend**: This is a bot-based application without a web UI
- **Telegram as interface**: All user interactions happen through Telegram's messaging platform
- **Mastra Playground**: Development/testing UI provided by Mastra framework (not user-facing)

### Backend Architecture

**Core Framework**: Mastra (v0.20.0+)
- **Purpose**: TypeScript-first AI agent framework for building autonomous agents and workflows
- **Key capabilities**: Agent orchestration, workflow management, durable execution, memory management

**Tools System**:
- Custom Telegram tools created using `@mastra/core/tools`
- `telegramSendMessageTool`: Sends messages with inline keyboards
- `telegramEditMessageTool`: Edits existing messages (for callback handling)
- Tools defined in `src/mastra/tools/telegramTool.ts`

**Workflow System**:
- Built using Mastra's `createWorkflow()` and `createStep()` APIs
- Workflows defined in `src/mastra/workflows/` directory
- Primary workflow: `fitnessWorkflow` handles Telegram interactions without AI
- Two-step workflow: (1) Process message/callback, (2) Log results
- Direct menu logic without LLM - faster and no API costs

**Execution Model**:
- **Inngest integration**: Provides durable execution and retry capabilities
- **Event-driven**: Workflows triggered by Telegram webhooks
- **Stateful**: Can suspend and resume execution with snapshots
- **Resilient**: Automatic retries on transient failures

**TypeScript Configuration**:
- Target: ES2022
- Module system: ES2022 with bundler resolution
- Strict mode enabled
- Source files in `src/` directory

### Data Storage & Memory

**Storage Adapter**: Shared PostgreSQL storage via `@mastra/pg`
- Configured in `src/mastra/index.ts` as `sharedPostgresStorage`
- Used for workflow state, agent memory, and conversation history

**Memory System** (from `@mastra/memory`):
- **Conversation history**: Stores recent messages for context
- **Semantic recall**: Vector-based retrieval of relevant past interactions
- **Working memory**: Persistent user preferences and state
- **Thread/Resource scoping**: Isolates conversations by user and thread ID

**Memory Storage Options**:
- PostgreSQL (`@mastra/pg`) - Primary choice with pgvector support
- LibSQL (`@mastra/libsql`) - Alternative local/remote storage
- Upstash (`@mastra/upstash`) - Redis-based storage option

### Logging & Observability

**Logger**: Custom `ProductionPinoLogger` extending `MastraLogger`
- Based on Pino logging library
- JSON-formatted structured logs
- Configurable log levels (DEBUG, INFO, WARN, ERROR)
- Timestamp and level formatting
- Defined in `src/mastra/index.ts`

**Error Handling**:
- `MastraError` for framework-specific errors
- `NonRetriableError` from Inngest for permanent failures
- Workflow-level and step-level retry configuration
- Abort signals for cancellable operations

### API & Integration Layer

**Webhook Triggers** (`src/triggers/`):
- **Telegram triggers**: Handle incoming messages and callback queries
- **Pattern**: `registerApiRoute()` creates POST endpoints that process webhooks
- **Event types**: Regular messages and inline keyboard callbacks
- **Payload extraction**: Username, message text, chat ID, callback data

**Telegram Integration** (`@mastra/telegram`):
- Webhook receiver at `/webhooks/telegram/action`
- Processes both text messages and button callbacks
- Extracts user context and triggers workflows

**Example Trigger Structure**:
```typescript
registerApiRoute("/webhooks/telegram/action", {
  method: "POST",
  handler: async (c) => {
    const payload = await c.req.json();
    const triggerInfo = { type, params, payload };
    await handler(mastra, triggerInfo);
  }
})
```

**MCP Server Support** (`@mastra/mcp`):
- Model Context Protocol integration for tool sharing
- Enables external tools to be registered with agents

### Deployment Architecture

**Inngest Serve** (`inngestServe` from `src/mastra/inngest`):
- Registers workflows as Inngest functions
- Handles event routing and execution
- Provides dashboard for monitoring

**Build Output** (`.mastra/output/`):
- Server package with OpenTelemetry instrumentation
- ESM module format
- Production-ready deployment artifacts

**Replit Integration**:
- Node.js >= 20.9.0 required
- Development mode uses Inngest dev server
- Production deploys to Replit infrastructure with Inngest cloud

## External Dependencies

### AI/ML Services
- **Not required**: Current implementation uses menu-based logic without AI
- **Optional for future**: Could add AI SDK if conversational features needed later

### Messaging Platform
- **Telegram Bot API** (`@slack/web-api` - likely misnamed dependency):
  - Webhook-based message receiving
  - Send/receive text messages
  - Inline keyboard support for buttons
  - User identification and chat management

### Database & Storage
- **PostgreSQL**: Primary data store
  - Requires: `DATABASE_URL` or connection parameters
  - Extensions needed: pgvector for semantic recall
  - Tables: threads, messages, working_memory, workflow snapshots

- **LibSQL** (optional alternative): SQLite-compatible embedded/remote DB
  - File-based or HTTP remote options
  - Vector search capabilities

### Infrastructure Services
- **Inngest** (`inngest` v3.40.2+):
  - Durable workflow execution
  - Event-driven architecture
  - Retry and error handling
  - Real-time monitoring dashboard
  - Requires: Inngest Cloud account for production or dev server for local

- **Inngest Realtime** (`@inngest/realtime`):
  - Live workflow status updates
  - SSE-based event streaming

### Development Tools
- **TypeScript** (v5.9.3+): Type system and compilation
- **tsx** (v4.20.3): TypeScript execution for development
- **Mastra CLI** (`mastra` dev dependency v0.14.0): Project scaffolding and management
- **Prettier** (v3.6.2): Code formatting
- **dotenv** (v17.2.0): Environment variable management

### Monitoring & Telemetry
- **OpenTelemetry** (via `.mastra/output/package.json`):
  - Distributed tracing
  - Instrumentation for Node.js
  - OTLP exporters (gRPC/HTTP)
  - Auto-instrumentation for popular libraries

### Validation & Utilities
- **Zod** (v3.25.76): Runtime type validation and schema definition
  - Used for workflow input/output schemas
  - Tool parameter validation
  - Configuration validation

### Optional Integrations
- **Exa** (`exa-js`): Search API integration (installed but not visible in code)
- **Pino** (v9.9.4): High-performance logging library

### Environment Variables Required
```bash
# Telegram (Required)
TELEGRAM_BOT_TOKEN=<token-from-@BotFather>

# Database (Automatically configured by Replit)
DATABASE_URL=<postgresql-connection-string>

# AI Services (Not currently required)
# OPENAI_API_KEY=<key>  # Optional - only needed if adding AI features

# Inngest (production - automatically configured)
# INNGEST_EVENT_KEY=<key>
# INNGEST_SIGNING_KEY=<key>
```

### Bot Features
The bot provides a Russian/Chechen language menu system with:
1. **Main Menu** - Welcome message with service overview
2. **Sports Nutrition Page** - Information about sports supplements
3. **Coaching Page** - Full-service training program details
4. **Application Page** - Instructions for submitting applications via WhatsApp
5. **WhatsApp Contact** - Direct link to contact the coach (https://wa.me/79222220217)

All navigation happens through inline keyboard buttons with instant menu updates.