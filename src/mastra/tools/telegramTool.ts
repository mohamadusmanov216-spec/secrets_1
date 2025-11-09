import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Telegram Bot Tool
 *
 * This tool provides methods to interact with the Telegram Bot API
 * It can send messages, edit messages, and handle inline keyboards
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN environment variable is not defined");
}

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Schema for inline keyboard buttons
const inlineKeyboardButtonSchema = z.object({
  text: z.string(),
  callback_data: z.string().optional(),
  url: z.string().optional(),
});

const inlineKeyboardMarkupSchema = z.object({
  inline_keyboard: z.array(z.array(inlineKeyboardButtonSchema)),
});

export const telegramSendMessageTool = createTool({
  id: "telegram-send-message",
  description: "Send a message to a Telegram chat with optional inline keyboard",
  
  inputSchema: z.object({
    chat_id: z.union([z.string(), z.number()]).describe("The chat ID to send the message to"),
    text: z.string().describe("The message text to send"),
    parse_mode: z.enum(["Markdown", "HTML", "MarkdownV2"]).optional().describe("Parse mode for the message"),
    reply_markup: inlineKeyboardMarkupSchema.optional().describe("Inline keyboard markup"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    message_id: z.number().optional(),
    error: z.string().optional(),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [telegramSendMessageTool] Sending message to chat:", { chat_id: context.chat_id });

    try {
      const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: context.chat_id,
          text: context.text,
          parse_mode: context.parse_mode || "Markdown",
          reply_markup: context.reply_markup,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger?.error("❌ [telegramSendMessageTool] Failed to send message:", data);
        return {
          success: false,
          error: data.description || "Failed to send message",
        };
      }

      logger?.info("✅ [telegramSendMessageTool] Message sent successfully");
      return {
        success: true,
        message_id: data.result?.message_id,
      };
    } catch (error) {
      logger?.error("❌ [telegramSendMessageTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const telegramEditMessageTool = createTool({
  id: "telegram-edit-message",
  description: "Edit an existing Telegram message text and inline keyboard",
  
  inputSchema: z.object({
    chat_id: z.union([z.string(), z.number()]).describe("The chat ID"),
    message_id: z.number().describe("The message ID to edit"),
    text: z.string().describe("The new message text"),
    parse_mode: z.enum(["Markdown", "HTML", "MarkdownV2"]).optional().describe("Parse mode for the message"),
    reply_markup: inlineKeyboardMarkupSchema.optional().describe("Inline keyboard markup"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [telegramEditMessageTool] Editing message:", { 
      chat_id: context.chat_id, 
      message_id: context.message_id 
    });

    try {
      const response = await fetch(`${TELEGRAM_API_URL}/editMessageText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: context.chat_id,
          message_id: context.message_id,
          text: context.text,
          parse_mode: context.parse_mode || "Markdown",
          reply_markup: context.reply_markup,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger?.error("❌ [telegramEditMessageTool] Failed to edit message:", data);
        return {
          success: false,
          error: data.description || "Failed to edit message",
        };
      }

      logger?.info("✅ [telegramEditMessageTool] Message edited successfully");
      return {
        success: true,
      };
    } catch (error) {
      logger?.error("❌ [telegramEditMessageTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
