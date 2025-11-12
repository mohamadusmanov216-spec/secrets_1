import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { telegramSendMessageTool, telegramEditMessageTool, telegramAnswerCallbackQueryTool, telegramSendPhotoTool } from "../tools/telegramTool";
import { getApplication, setApplication, deleteApplication, hasApplication } from "../../utils/applicationStorage";

const ADMIN_ID = "1061591635";

const NUTRITION_VIDEO_TEXT = `💪 СПОРТ ПИТАНИЕ - хьан успех юкъ дала 🙌🏼

📹 Хьаж видео т1ехь:
https://www.youtube.com/watch?v=ct3l0gPaVQI

Х1окх видео т1ехь хьаж бе:
👇🏼 Массан набор т1е х1усам
👇🏼 Вес скинутт лакхара пайд
👇🏼 Спорт питание мел сатуш
👇🏼 Курсаш правильна лело

🎁 БОНУС ХЬАН: 20% СКИДКА 🙌🏼

Дехар до, язъе "Коуч" х1окх адрес т1е:
Wa.me/79222220217

Хаъ х1уна баха мел саттуш! 💯`;

const COACHING_VIDEO_TEXT = `🏆 Хьа тренировочный процесс юкъ со включить х1унда ва вез хьаж эц видео т1ехь.

📹 Хьаж видео т1ехь:
https://www.youtube.com/watch?v=Z38azV8aDzI

📲 Wa.me/79222220217
Напиши «Коуч» и я дам тебе 20% скидку 🎁`;

const MAIN_MENU_TEXT = `💪 Сун хаъ хьо дик форме ва луъш вуй, йиаг ловш т1е йоьхаг товш волш хил везш ву НОХЧО

Х1окх чохь хир бол пайд: 👇🏼
1️⃣ Мышечный масс набрать мух я ез
2️⃣ Вес скинуть мух я ез
3️⃣ Спорт питание муьлхаг лело ез
4️⃣ Фармакологих лаьцна

Вай НОХЧИ къам г1арч аьл хилит луъш ар баькхан бу х1ар некъ 🙌🏼`;

const processTelegramMessage = createStep({
  id: "process-telegram-message",
  description: "Process incoming Telegram message or callback query",

  inputSchema: z.object({
    threadId: z.string().describe("Unique thread ID for this conversation"),
    chatId: z.union([z.string(), z.number()]).describe("Telegram chat ID"),
    messageId: z.number().optional().describe("Message ID for editing"),
    messageText: z.string().optional().describe("Text of the message"),
    callbackData: z.string().optional().describe("Callback data from button press"),
    callbackQueryId: z.string().optional().describe("Callback query ID for answering"),
    userName: z.string().optional().describe("Username of the sender"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    action: z.string(),
  }),

  execute: async ({ inputData, mastra, runtimeContext }) => {
    const logger = mastra?.getLogger();
    logger?.info("🚀 [FitnessBot] Processing message", {
      chatId: inputData.chatId,
      hasCallback: !!inputData.callbackData,
      hasText: !!inputData.messageText,
    });

    const { chatId, messageText, callbackData, messageId, userName, callbackQueryId } = inputData;

    if (messageText === "/start") {
      logger?.info("📤 [FitnessBot] Sending welcome message");
      
      await telegramSendMessageTool.execute({
        context: {
          chat_id: chatId,
          text: MAIN_MENU_TEXT,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💪 Про спорт питание', callback_data: 'nutrition_video' }
              ],
              [
                { text: '🏆 Под ключ с Исламом', callback_data: 'coaching_video' }
              ]
            ]
          },
        },
        mastra,
        runtimeContext,
      });

      return { success: true, action: "start_sent" };
    }

    if (hasApplication(chatId.toString()) && messageText && !callbackData) {
      logger?.info("📝 [FitnessBot] Processing application answer");
      
      const userApp = getApplication(chatId.toString());
      if (!userApp) {
        logger?.error("❌ [FitnessBot] Application not found for chatId:", chatId);
        return { success: false, action: "application_error" };
      }
      const answer = messageText;

      const questions = [
        `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 2/6:\n\nРост и вес?\n\n*Пример:* 180 см 75 кг`,
        `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 3/6:\n\nУ тебя есть заболевания, травмы, аллергии или перенесенные операции?\n\n*Если нет, напиши "Нет"*`,
        `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 4/6:\n\nУ тебя есть цели и задачи на тренировочный процесс?\n\n*Пример:* набор массы, скинуть вес, рельеф`,
        `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 5/6:\n\nПланируете ли использовать фармакологию, SARMS?\n\n*Да/Нет*`,
        `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 6/6:\n\nИспользуете ли вы фармакологию или SARMS сейчас? Если да, то какие препараты и дозировки?\n\n*Если нет, напиши "Нет"*`
      ];

      const answerKeys = ['nameAge', 'heightWeight', 'health', 'goals', 'plansPharmacology', 'currentPharmacology'];

      if (userApp.step <= 5) {
        userApp.answers[answerKeys[userApp.step - 1]] = answer;
        userApp.step++;
        
        setApplication(chatId.toString(), {
          step: userApp.step,
          answers: userApp.answers,
          createdAt: userApp.createdAt,
        });

        await telegramSendMessageTool.execute({
          context: {
            chat_id: chatId,
            text: questions[userApp.step - 2],
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: '❌ Отменить заявку', callback_data: 'cancel_application' }]
              ]
            },
          },
          runtimeContext,
        });

      } else {
        userApp.answers.currentPharmacology = answer;

        const applicationText = `🎯 *НОВАЯ ЗАЯВКА НА ТРЕНИРОВКИ*

👤 *Основная информация:*
• Имя и возраст: ${userApp.answers.nameAge || 'Не указано'}
• Рост и вес: ${userApp.answers.heightWeight || 'Не указано'}

🏥 *Здоровье:*
• Состояние: ${userApp.answers.health || 'Не указано'}

🎯 *Цели тренировок:*
• Задачи: ${userApp.answers.goals || 'Не указано'}

💊 *Фармакология:*
• Планы: ${userApp.answers.plansPharmacology || 'Не указано'}
• Текущая: ${userApp.answers.currentPharmacology || 'Не указано'}

📱 *Контактные данные:*
• От: @${userName || 'без username'}
• ID: ${chatId}
• Время: ${new Date().toLocaleString('ru-RU')}`;

        logger?.info("📨 [FitnessBot] Sending application to admin");
        
        await telegramSendMessageTool.execute({
          context: {
            chat_id: ADMIN_ID,
            text: applicationText,
            parse_mode: "Markdown",
          },
          runtimeContext,
        });

        deleteApplication(chatId.toString());

        await telegramSendMessageTool.execute({
          context: {
            chat_id: chatId,
            text: `✅ *ЗАЯВКА ПРИНЯТА!* 🎉\n\nСпасибо за вашу заявку! 🙏 Я свяжусь с вами в ближайшее время.\n\n💎 *БОНУС:* Напиши «Коуч» на Wa.me/79222220217 и получи 20% СКИДКУ! 🔥`,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
              ]
            },
          },
          runtimeContext,
        });
      }

      return { success: true, action: "application_processed" };
    }

    if (callbackData && messageId) {
      logger?.info("🔘 [FitnessBot] Processing callback", { callback: callbackData });

      if (callbackQueryId) {
        await telegramAnswerCallbackQueryTool.execute({
          context: {
            callback_query_id: callbackQueryId,
          },
          runtimeContext,
        });
      }

      switch (callbackData) {
        case 'start_application':
          setApplication(chatId.toString(), { 
            step: 1, 
            answers: {}, 
            createdAt: new Date().toISOString() 
          });

          await telegramEditMessageTool.execute({
            context: {
              chat_id: chatId,
              message_id: messageId,
              text: `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 1/6:\n\nВаше имя и возраст?\n\n*Пример:* Ахмад 21`,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: '❌ Отменить заявку', callback_data: 'cancel_application' }]
                ]
              },
            },
            runtimeContext,
          });
          break;

        case 'cancel_application':
          deleteApplication(chatId.toString());
          
          await telegramEditMessageTool.execute({
            context: {
              chat_id: chatId,
              message_id: messageId,
              text: `❌ *ЗАЯВКА ОТМЕНЕНА*\n\nВозвращайтесь, когда будете готовы начать тренировки!`,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
                ]
              },
            },
            runtimeContext,
          });
          break;

        case 'nutrition_video':
          await telegramEditMessageTool.execute({
            context: {
              chat_id: chatId,
              message_id: messageId,
              text: NUTRITION_VIDEO_TEXT,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '🏆 Под ключ с Исламом', callback_data: 'coaching_video' }
                  ],
                  [
                    { text: '📝 Оставить заявку', callback_data: 'start_application' }
                  ]
                ]
              },
            },
            runtimeContext,
          });
          break;

        case 'coaching_video':
          await telegramEditMessageTool.execute({
            context: {
              chat_id: chatId,
              message_id: messageId,
              text: COACHING_VIDEO_TEXT,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '💪 Про спорт питание', callback_data: 'nutrition_video' }
                  ],
                  [
                    { text: '📝 Оставить заявку', callback_data: 'start_application' }
                  ]
                ]
              },
            },
            runtimeContext,
          });
          break;

        case 'main_menu':
          await telegramEditMessageTool.execute({
            context: {
              chat_id: chatId,
              message_id: messageId,
              text: MAIN_MENU_TEXT,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '💪 Про спорт питание', callback_data: 'nutrition_video' }
                  ],
                  [
                    { text: 'Под ключ с Исламом', callback_data: 'coaching_video' }
                  ]
                ]
              },
            },
            runtimeContext,
          });
          break;
      }

      return { success: true, action: `callback_${callbackData}` };
    }

    logger?.info("💬 [FitnessBot] Sending help message");
    await telegramSendMessageTool.execute({
      context: {
        chat_id: chatId,
        text: "Привет! 👋 Используй команду /start чтобы увидеть меню.",
        parse_mode: "Markdown",
      },
      runtimeContext,
    });

    return { success: true, action: "help_sent" };
  },
});

const logResults = createStep({
  id: "log-results",
  description: "Log the results of the fitness bot interaction",

  inputSchema: z.object({
    success: z.boolean(),
    action: z.string(),
  }),

  outputSchema: z.object({
    completed: z.boolean(),
    summary: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("✅ [FitnessBot] Workflow completed", { action: inputData.action });

    return {
      completed: true,
      summary: `Fitness bot handled action: ${inputData.action}`,
    };
  },
});

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
