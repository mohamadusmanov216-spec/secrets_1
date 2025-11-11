import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { telegramSendMessageTool, telegramEditMessageTool } from "../tools/telegramTool";

/**
 * Fitness Bot Workflow
 *
 * This workflow handles incoming Telegram messages and callback queries
 * for the fitness coaching bot. It processes user interactions and
 * responds with appropriate menu options and information.
 */

// Text constants
const MAIN_TEXT = `🏋️‍♂️ *Фитнес с Исламом*

Сун хаъ хьо дик форме ва луъш вуй, йиаг ловш т1е йоьхаг товш волш хил везш ву НОХЧО

✅ *Х1окх чохь хир бол пайд:*
1. Мышечный масс набрать мух я ез.
2. Вес скинуть мух я ез.
3. Спорт питание муьлхаг лело ез. 
4. Фармакологих лаьцна. 

💪 Вай НОХЧИ къам г1арч аьл хилит луъш ар баькхан бу х1ар некъ.`;

const NUTRITION_TEXT = `🥗 *Про спорт питание*

Х1окх видео хьаьжа бе тренировкш, спорт питание йол ма елахь 🙌🏼

📞 *Контакты:*
Wa.me/79222220217

💎 Напиши «Коуч» и я дам тебе 20% скидку`;

const COACHING_TEXT = `💪 *Под ключ с Исламом*

Хьа тренировочный процесс юкъ со включить х1унда ва вез х1аж эц видео т1ехь.

📞 *Контакты:*
Wa.me/79222220217

💎 Напиши «Коуч» и я дам тебе 20% скидку`;

const APPLICATION_TEXT = `📝 *Оставить заявку*

Чтобы оставить заявку, напиши мне в WhatsApp сообщение:

Заявка от бота: [Имя] [Возраст] [Опыт тренировок]

📋 *Пример:*
«Заявка от бота: Ахмад 21 2 года»

✅ Я свяжусь с тобой в ближайшее время!`;

// Keyboard layouts
const MAIN_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🥗 Про спорт питание', callback_data: 'nutrition' },
      { text: '💪 Под ключ с Исламом', callback_data: 'coaching' }
    ],
    [{ text: '📞 Связаться', url: 'https://wa.me/79222220217' }]
  ]
};

const NUTRITION_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '💪 Тренировки', callback_data: 'coaching' },
      { text: '📝 Оставить заявку', callback_data: 'application' }
    ],
    [{ text: '📞 Связаться', url: 'https://wa.me/79222220217' }],
    [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
  ]
};

const COACHING_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🥗 Питание', callback_data: 'nutrition' },
      { text: '📝 Оставить заявку', callback_data: 'application' }
    ],
    [{ text: '📞 Связаться', url: 'https://wa.me/79222220217' }],
    [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
  ]
};

const APPLICATION_KEYBOARD = {
  inline_keyboard: [
    [{ text: '📱 Написать в WhatsApp', url: 'https://wa.me/79222220217' }],
    [
      { text: '🥗 Питание', callback_data: 'nutrition' },
      { text: '💪 Тренировки', callback_data: 'coaching' }
    ],
    [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
  ]
};

/**
 * Step 1: Process Telegram Message or Callback
 * This step handles both regular messages and callback button presses
 */
const processTelegramMessage = createStep({
  id: "process-telegram-message",
  description: "Process incoming Telegram message or callback query and respond with appropriate menu",

  inputSchema: z.object({
    threadId: z.string().describe("Unique thread ID for this conversation"),
    chatId: z.union([z.string(), z.number()]).describe("Telegram chat ID"),
    messageId: z.number().optional().describe("Message ID for editing (callback queries)"),
    messageText: z.string().optional().describe("Text of the message (for regular messages)"),
    callbackData: z.string().optional().describe("Callback data from button press"),
    userName: z.string().optional().describe("Username of the sender"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    action: z.string(),
    messageType: z.enum(["sent", "edited", "help"]),
  }),

  execute: async ({ inputData, mastra, runtimeContext }) => {
    const logger = mastra?.getLogger();
    logger?.info("🚀 [Step 1] Processing Telegram message/callback...", {
      chatId: inputData.chatId,
      messageText: inputData.messageText,
      callbackData: inputData.callbackData,
    });

    let result;

    // Handle /start command
    if (inputData.messageText === "/start") {
      logger?.info("📤 [Step 1] Sending main menu");
      result = await telegramSendMessageTool.execute({
        context: {
          chat_id: inputData.chatId,
          text: MAIN_TEXT,
          parse_mode: "Markdown",
          reply_markup: MAIN_KEYBOARD,
        },
        runtimeContext,
      });
      
      return {
        success: result.success,
        action: "main_menu_sent",
        messageType: "sent",
      };
    }
    
    // Handle callback queries (button presses)
    if (inputData.callbackData && inputData.messageId) {
      const action = inputData.callbackData;
      logger?.info("📝 [Step 1] Handling callback:", { action });

      let text = MAIN_TEXT;
      let keyboard = MAIN_KEYBOARD;

      switch (action) {
        case 'nutrition':
          text = NUTRITION_TEXT;
          keyboard = NUTRITION_KEYBOARD;
          break;
        case 'coaching':
          text = COACHING_TEXT;
          keyboard = COACHING_KEYBOARD;
          break;
        case 'application':
          text = APPLICATION_TEXT;
          keyboard = APPLICATION_KEYBOARD;
          break;
        case 'main_menu':
          text = MAIN_TEXT;
          keyboard = MAIN_KEYBOARD;
          break;
      }

      result = await telegramEditMessageTool.execute({
        context: {
          chat_id: inputData.chatId,
          message_id: inputData.messageId,
          text: text,
          parse_mode: "Markdown",
          reply_markup: keyboard,
        },
        runtimeContext,
      });

      return {
        success: result.success,
        action: `menu_${action}`,
        messageType: "edited",
      };
    }

    // Handle other messages
    logger?.info("💬 [Step 1] Sending help message");
    result = await telegramSendMessageTool.execute({
      context: {
        chat_id: inputData.chatId,
        text: "Привет! 👋 Используй команду /start чтобы увидеть меню.",
        parse_mode: "Markdown",
      },
      runtimeContext,
    });

    return {
      success: result.success,
      action: "help_sent",
      messageType: "help",
    };
  },
});

/**
 * Step 2: Log Results
 * This step logs the final results of the workflow
 */
const logResults = createStep({
  id: "log-results",
  description: "Log the results of the fitness bot interaction",

  inputSchema: z.object({
    success: z.boolean(),
    action: z.string(),
    messageType: z.enum(["sent", "edited", "help"]),
  }),

  outputSchema: z.object({
    completed: z.boolean(),
    summary: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📤 [Step 2] Logging workflow results...");

    const summary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏋️‍♂️ FITNESS BOT WORKFLOW RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Success: ${inputData.success}
🎯 Action: ${inputData.action}
📨 Message Type: ${inputData.messageType}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    logger?.info(summary);
    logger?.info("✅ [Step 2] Workflow completed successfully");

    return {
      completed: true,
      summary: `Fitness bot handled action: ${inputData.action}`,
    };
  },
});

/**
 * Create the fitness bot workflow by chaining steps
 */
export const fitnessWorkflow = createWorkflow({
  id: "fitness-bot-workflow",

  inputSchema: z.object({
    threadId: z.string().describe("Unique thread ID for this conversation"),
    chatId: z.union([z.string(), z.number()]).describe("Telegram chat ID"),
    messageId: z.number().optional().describe("Message ID for editing"),
    messageText: z.string().optional().describe("Text of the message"),
    callbackData: z.string().optional().describe("Callback data from button press"),
    userName: z.string().optional().describe("Username of the sender"),
  }) as any,

  outputSchema: z.object({
    completed: z.boolean(),
    summary: z.string(),
  }),
})
  .then(processTelegramMessage as any)
  .then(logResults as any)
  .commit();
