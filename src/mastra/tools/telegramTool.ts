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

export const telegramAnswerCallbackQueryTool = createTool({
  id: "telegram-answer-callback-query",
  description: "Answer a callback query to remove loading state from button",
  
  inputSchema: z.object({
    callback_query_id: z.string().describe("Callback query ID to answer"),
    text: z.string().optional().describe("Optional notification text to show"),
    show_alert: z.boolean().optional().describe("Show as alert instead of notification"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [telegramAnswerCallbackQueryTool] Answering callback query");

    try {
      const response = await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callback_query_id: context.callback_query_id,
          text: context.text,
          show_alert: context.show_alert || false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger?.error("❌ [telegramAnswerCallbackQueryTool] Failed to answer callback:", data);
        return {
          success: false,
          error: data.description || "Failed to answer callback query",
        };
      }

      logger?.info("✅ [telegramAnswerCallbackQueryTool] Callback answered successfully");
      return {
        success: true,
      };
    } catch (error) {
      logger?.error("❌ [telegramAnswerCallbackQueryTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const telegramSendPhotoTool = createTool({
  id: "telegram-send-photo",
  description: "Send a photo to a Telegram chat with optional caption and inline keyboard",
  
  inputSchema: z.object({
    chat_id: z.union([z.string(), z.number()]).describe("The chat ID to send the photo to"),
    photo_path: z.string().optional().describe("Local file path to photo (relative to project root)"),
    photo_file_id: z.string().optional().describe("Telegram file_id for reusing uploaded photos"),
    caption: z.string().optional().describe("Photo caption"),
    parse_mode: z.enum(["Markdown", "HTML", "MarkdownV2"]).optional().describe("Parse mode for the caption"),
    reply_markup: inlineKeyboardMarkupSchema.optional().describe("Inline keyboard markup"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    message_id: z.number().optional(),
    file_id: z.string().optional().describe("File ID of the sent photo for reuse"),
    error: z.string().optional(),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [telegramSendPhotoTool] Sending photo to chat:", { chat_id: context.chat_id });

    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const formData = new FormData();
      formData.append('chat_id', String(context.chat_id));
      
      if (context.photo_file_id) {
        // Use existing file_id (fastest method)
        formData.append('photo', context.photo_file_id);
      } else if (context.photo_path) {
        // Upload new file
        const photoPath = path.join(process.cwd(), context.photo_path);
        const photoBuffer = await fs.readFile(photoPath);
        const blob = new Blob([photoBuffer], { type: 'image/jpeg' });
        formData.append('photo', blob, 'photo.jpg');
      } else {
        logger?.error("❌ [telegramSendPhotoTool] No photo source provided");
        return {
          success: false,
          error: "Either photo_path or photo_file_id must be provided",
        };
      }

      if (context.caption) {
        formData.append('caption', context.caption);
      }
      if (context.parse_mode) {
        formData.append('parse_mode', context.parse_mode);
      }
      if (context.reply_markup) {
        formData.append('reply_markup', JSON.stringify(context.reply_markup));
      }

      const response = await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
        method: "POST",
        body: formData as any,
      });

      const data = await response.json();

      if (!response.ok) {
        logger?.error("❌ [telegramSendPhotoTool] Failed to send photo:", data);
        return {
          success: false,
          error: data.description || "Failed to send photo",
        };
      }

      logger?.info("✅ [telegramSendPhotoTool] Photo sent successfully");
      const fileId = data.result?.photo?.[data.result.photo.length - 1]?.file_id;
      logger?.info("📸 [telegramSendPhotoTool] File ID for reuse:", { file_id: fileId });
      
      return {
        success: true,
        message_id: data.result?.message_id,
        file_id: fileId,
      };
    } catch (error) {
      logger?.error("❌ [telegramSendPhotoTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
