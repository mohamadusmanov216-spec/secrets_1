import type { ContentfulStatusCode } from "hono/utils/http-status";

import { registerApiRoute } from "../mastra/inngest";
import { Mastra } from "@mastra/core";
import { telegramAnswerCallbackQueryTool, telegramEditMessageTool } from "../mastra/tools/telegramTool";

const NUTRITION_VIDEO_TEXT = `СПОРТ ПИТАНИЕ - хьан успех юкъ дала 🙌🏼

Х1окх видео т1ехь хьаж бе:
👇🏼 Массан набор т1е х1усам
👇🏼 Вес скинутт лакхара пайд
👇🏼 Спорт питание мел сатуш
👇🏼 Курсаш правильна лело

БОНУС ХЬАН: 20% СКИДКА 🙌🏼

Дехар до, язъе "Коуч" х1окх адрес т1е:
Wa.me/79222220217

Хаъ х1уна баха мел саттуш!`;

const COACHING_VIDEO_TEXT = `Хьа тренировочный процесс юкъ со включить х1унда ва вез хьаж эц видео т1ехь.

Wa.me/79222220217
Напиши «Коуч» и я дам тебе 20% скидку.`;

const MAIN_MENU_TEXT = `Сун хаъ хьо дик форме ва луъш вуй, йиаг ловш т1е йоьхаг товш волш хил везш ву НОХЧО

Х1окх чохь хир бол пайд:👇🏼
1. Мышечный масс набрать мух я ез.
2. Вес скинуть мух я ез.
3. Спорт питание муьлхаг лело ез.
4. Фармакологих лаьцна.

Вай НОХЧИ къам г1арч аьл хилит луъш ар баькхан бу х1ар некъ.`;

export type TriggerInfoTelegramOnNewMessage = {
  type: "telegram/message";
  params: {
    userName: string;
    message: string;
    chatId: number | string;
    messageId?: number;
    callbackData?: string;
    callbackQueryId?: string;
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
            const callbackData = payload.callback_query.data;
            const chatId = payload.callback_query.message?.chat.id;
            const messageId = payload.callback_query.message?.message_id;
            const callbackQueryId = payload.callback_query.id;

            // Fast path: Handle navigation callbacks directly without workflow
            const simpleNavigationCallbacks = ['nutrition_video', 'coaching_video', 'main_menu'];
            
            if (simpleNavigationCallbacks.includes(callbackData)) {
              logger?.info("⚡ [Telegram] Fast-path callback", { callback: callbackData });

              // Determine response based on callback
              let text = '';
              let replyMarkup: any;

              switch (callbackData) {
                case 'nutrition_video':
                  text = NUTRITION_VIDEO_TEXT;
                  replyMarkup = {
                    inline_keyboard: [
                      [{ text: 'Под ключ с Исламом', callback_data: 'coaching_video' }],
                      [{ text: 'Оставить заявку', callback_data: 'start_application' }]
                    ]
                  };
                  break;
                case 'coaching_video':
                  text = COACHING_VIDEO_TEXT;
                  replyMarkup = {
                    inline_keyboard: [
                      [{ text: 'Про спорт питание', callback_data: 'nutrition_video' }],
                      [{ text: 'Оставить заявку', callback_data: 'start_application' }]
                    ]
                  };
                  break;
                case 'main_menu':
                  text = MAIN_MENU_TEXT;
                  replyMarkup = {
                    inline_keyboard: [
                      [{ text: 'Про спорт питание', callback_data: 'nutrition_video' }],
                      [{ text: 'Под ключ с Исламом', callback_data: 'coaching_video' }]
                    ]
                  };
                  break;
              }

              // Execute both API calls in parallel for speed
              await Promise.all([
                telegramAnswerCallbackQueryTool.execute({
                  context: { callback_query_id: callbackQueryId },
                  mastra,
                  runtimeContext: {} as any,
                }),
                telegramEditMessageTool.execute({
                  context: {
                    chat_id: chatId,
                    message_id: messageId,
                    text,
                    parse_mode: "Markdown" as const,
                    reply_markup: replyMarkup,
                  },
                  mastra,
                  runtimeContext: {} as any,
                }),
              ]);

              logger?.info("✅ [Telegram] Fast-path completed");
              return c.text("OK", 200);
            }

            // Callback query from inline keyboard button (complex ones go to workflow)
            triggerInfo = {
              type: "telegram/message",
              params: {
                userName: payload.callback_query.from?.username || "unknown",
                message: payload.callback_query.data || "",
                chatId: payload.callback_query.message?.chat.id,
                messageId: payload.callback_query.message?.message_id,
                callbackData: payload.callback_query.data,
                callbackQueryId: payload.callback_query.id,
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
