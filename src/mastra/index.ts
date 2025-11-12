import { Mastra } from "@mastra/core";
import { MastraError } from "@mastra/core/error";
import { PinoLogger } from "@mastra/loggers";
import { LogLevel, MastraLogger } from "@mastra/core/logger";
import pino from "pino";
import { MCPServer } from "@mastra/mcp";
import { NonRetriableError } from "inngest";
import { z } from "zod";

import { sharedPostgresStorage } from "./storage";
import { inngest, inngestServe } from "./inngest";
import { fitnessWorkflow } from "./workflows/fitnessWorkflow";
import { registerTelegramTrigger } from "../triggers/telegramTriggers";

class ProductionPinoLogger extends MastraLogger {
  protected logger: pino.Logger;

  constructor(
    options: {
      name?: string;
      level?: LogLevel;
    } = {},
  ) {
    super(options);

    this.logger = pino({
      name: options.name || "app",
      level: options.level || LogLevel.INFO,
      base: {},
      formatters: {
        level: (label: string, _number: number) => ({
          level: label,
        }),
      },
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    });
  }

  debug(message: string, args: Record<string, any> = {}): void {
    this.logger.debug(args, message);
  }

  info(message: string, args: Record<string, any> = {}): void {
    this.logger.info(args, message);
  }

  warn(message: string, args: Record<string, any> = {}): void {
    this.logger.warn(args, message);
  }

  error(message: string, args: Record<string, any> = {}): void {
    this.logger.error(args, message);
  }
}

export const mastra = new Mastra({
  // Storage disabled - not needed for simple menu bot
  // storage: sharedPostgresStorage,
  // Register your workflows here
  workflows: { fitnessWorkflow },
  // Register your agents here
  agents: {},
  mcpServers: {
    allTools: new MCPServer({
      name: "allTools",
      version: "1.0.0",
      tools: {},
    }),
  },
  bundler: {
    // A few dependencies are not properly picked up by
    // the bundler if they are not added directly to the
    // entrypoint.
    externals: [
      "@slack/web-api",
      "inngest",
      "inngest/hono",
      "hono",
      "hono/streaming",
    ],
    // sourcemaps are good for debugging.
    sourcemap: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    middleware: [
      async (c, next) => {
        const mastra = c.get("mastra");
        const logger = mastra?.getLogger();
        logger?.debug("[Request]", { method: c.req.method, url: c.req.url });
        try {
          await next();
        } catch (error) {
          logger?.error("[Response]", {
            method: c.req.method,
            url: c.req.url,
            error,
          });
          if (error instanceof MastraError) {
            if (error.id === "AGENT_MEMORY_MISSING_RESOURCE_ID") {
              // This is typically a non-retirable error. It means that the request was not
              // setup correctly to pass in the necessary parameters.
              throw new NonRetriableError(error.message, { cause: error });
            }
          } else if (error instanceof z.ZodError) {
            // Validation errors are never retriable.
            throw new NonRetriableError(error.message, { cause: error });
          }

          throw error;
        }
      },
    ],
    apiRoutes: [
      // ======================================================================
      // Static Assets Endpoint
      // ======================================================================
      {
        path: "/assets/main_menu_photo.jpg",
        method: "GET",
        createHandler: async ({ mastra }) => {
          return async (c) => {
            const logger = mastra.getLogger();
            logger?.debug("[Static Asset] Serving main menu photo");
            
            try {
              const fs = await import('fs/promises');
              const path = await import('path');
              
              const photoPath = path.join(process.cwd(), 'attached_assets', 'main_menu_photo.jpg');
              const photoBuffer = await fs.readFile(photoPath);
              
              return c.body(photoBuffer, 200, {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000',
              });
            } catch (error) {
              logger?.error("[Static Asset] Error serving photo:", error);
              return c.text("Photo not found", 404);
            }
          };
        },
      },

      // ======================================================================
      // Inngest Integration Endpoint
      // ======================================================================
      {
        path: "/api/inngest",
        method: "ALL",
        createHandler: async ({ mastra }) => inngestServe({ mastra, inngest }),
      },

      // ======================================================================
      // Connector Webhook Triggers
      // ======================================================================
      // Add more connector triggers below using the same pattern
      // ...registerGithubTrigger({ ... }),
      // ...registerSlackTrigger({ ... }),
      // ...registerStripeWebhook({ ... }),
      
      // Telegram Fitness Bot Trigger
      ...registerTelegramTrigger({
        triggerType: "telegram/message",
        handler: async (mastra, triggerInfo) => {
          const logger = mastra.getLogger();
          logger?.info("🎯 [Telegram Trigger] Processing message", {
            userName: triggerInfo.params.userName,
            chatId: triggerInfo.params.chatId,
            hasCallback: !!triggerInfo.params.callbackData,
          });

          // Create a unique thread ID for this conversation
          const threadId = `telegram-fitness-${triggerInfo.params.chatId}`;

          // Start the fitness bot workflow
          const run = await fitnessWorkflow.createRunAsync();
          await run.start({
            inputData: {
              threadId,
              chatId: triggerInfo.params.chatId,
              messageId: triggerInfo.params.messageId,
              messageText: triggerInfo.params.message,
              callbackData: triggerInfo.params.callbackData,
              callbackQueryId: triggerInfo.params.callbackQueryId,
              userName: triggerInfo.params.userName,
            },
          });
        },
      }),
    ],
  },
  logger:
    process.env.NODE_ENV === "production"
      ? new ProductionPinoLogger({
          name: "Mastra",
          level: "info",
        })
      : new PinoLogger({
          name: "Mastra",
          level: "info",
        }),
});

/*  Sanity check 1: Throw an error if there are more than 1 workflows.  */
// !!!!!! Do not remove this check. !!!!!!
if (Object.keys(mastra.getWorkflows()).length > 1) {
  throw new Error(
    "More than 1 workflows found. Currently, more than 1 workflows are not supported in the UI, since doing so will cause app state to be inconsistent.",
  );
}

/*  Sanity check 2: Throw an error if there are more than 1 agents.  */
// !!!!!! Do not remove this check. !!!!!!
if (Object.keys(mastra.getAgents()).length > 1) {
  throw new Error(
    "More than 1 agents found. Currently, more than 1 agents are not supported in the UI, since doing so will cause app state to be inconsistent.",
  );
}