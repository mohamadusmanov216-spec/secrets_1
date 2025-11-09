import type { ContentfulStatusCode } from "hono/utils/http-status";

import { registerApiRoute } from "../mastra/inngest";
import { Mastra } from "@mastra/core";

export type TriggerInfoTelegramOnNewMessage = {
  type: "telegram/message";
  params: {
    userName: string;
    message: string;
    chatId: number | string;
    messageId?: number;
    callbackData?: string;
  };
  payload: any;
};

export function registerTelegramTrigger({
  triggerType,
  handler,
}: {
  triggerType: string;
  handler: (
    mastra: Mastra,
    triggerInfo: TriggerInfoTelegramOnNewMessage,
  ) => Promise<void>;
}) {
  return [
    registerApiRoute("/webhooks/telegram/action", {
      method: "POST",
      handler: async (c) => {
        const mastra = c.get("mastra");
        const logger = mastra.getLogger();
        try {
          const payload = await c.req.json();

          logger?.info("📝 [Telegram] Received webhook payload", {
            hasMessage: !!payload.message,
            hasCallbackQuery: !!payload.callback_query,
          });

          // Handle both regular messages and callback queries
          let triggerInfo: TriggerInfoTelegramOnNewMessage;

          if (payload.callback_query) {
            // Callback query from inline keyboard button
            triggerInfo = {
              type: "telegram/message",
              params: {
                userName: payload.callback_query.from?.username || "unknown",
                message: payload.callback_query.data || "",
                chatId: payload.callback_query.message?.chat.id,
                messageId: payload.callback_query.message?.message_id,
                callbackData: payload.callback_query.data,
              },
              payload,
            };
          } else if (payload.message) {
            // Regular message
            triggerInfo = {
              type: "telegram/message",
              params: {
                userName: payload.message.from?.username || "unknown",
                message: payload.message.text || "",
                chatId: payload.message.chat.id,
              },
              payload,
            };
          } else {
            logger?.warn("⚠️ [Telegram] Unknown payload type, ignoring");
            return c.text("OK", 200);
          }

          await handler(mastra, triggerInfo);

          return c.text("OK", 200);
        } catch (error) {
          logger?.error("❌ [Telegram] Error handling webhook:", error);
          return c.text("Internal Server Error", 500);
        }
      },
    }),
  ];
}
