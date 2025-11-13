import { Telegraf, Context } from 'telegraf';
import pino from 'pino';

const logger = pino();

const MAIN_PHOTO_URL = 'https://ibb.co/0yTM2xHP';

const NUTRITION_VIDEO_TEXT = `💪 СПОРТ ПИТАНИЕ - мой успех 🙌🏻

📹 Просмотр видео: 
https://www.youtube.com/watch?v=ct3l0gPaVQI

Только после просмотра видео ты:
👇🏻 Узнаешь как набрать массу 
👇🏻 Как скинуть лишний вес 
👇🏻 Как правильно пить и что употреблять в разных случаях
👇🏻 Как правильно курсить 

🎁 ТВОЙ БОНУС: 20% СКИДКА 🙌🏻

Напиши мне «Коуч» переходя на ватсапп 
Wa.me/79222220217`;

const COACHING_VIDEO_TEXT = `🏆Почему ты должен подключить себе услугу «Под ключ с Исламом»? Досмотри это видео👇🏻

📹Просмотр видео:
https://www.youtube.com/watch?v=Z38azV8aDzI

📲 Wa.me/79252159494
Напиши «Коуч» мне на ватсапп👆🏻 и получи 20% скидку на спорт пит🎁`;

const MAIN_MENU_TEXT = `Я знаю , что ты хочешь себе хорошую форму, знаю , что в футболке или в кофте ты хочешь быть в центре внимания среди всех😎

Что ты можешь получить:
1️⃣Как набрать мышечную массу💪
2️⃣Как избавиться от лишнего веса🔥
3️⃣Как правильно собрать под себя курс🔝
4️⃣И конечно же про «Черный рынок»😈

Придерживаемся правила из трех буквы «ННН»(Нет Ничего Невозможного) и топим дальше 🚀`;

// Простое хранилище в памяти (временное)
const applications = new Map();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Главное меню с фото
const showMainMenu = async (ctx: Context, chatId?: number) => {
  const targetChatId = chatId || ctx.chat?.id;
  if (!targetChatId) return;

  try {
    // Отправляем фото с описанием
    await ctx.telegram.sendPhoto(targetChatId, MAIN_PHOTO_URL, {
      caption: MAIN_MENU_TEXT,
      parse_mode: 'Markdown' as const,
      reply_markup: {
        inline_keyboard: [
          [{ text: '💪 Про спорт питание', callback_data: 'nutrition_video' }],
          [{ text: '🏆 Под ключ с Исламом', callback_data: 'coaching_video' }],
          [{ text: '📋 Заполнить заявку', callback_data: 'start_application' }]
        ]
      }
    });
  } catch (error) {
    // Если не удалось отправить фото, отправляем просто текст
    logger.error('Failed to send photo, falling back to text:', error);
    await ctx.telegram.sendMessage(targetChatId, MAIN_MENU_TEXT, {
      parse_mode: 'Markdown' as const,
      reply_markup: {
        inline_keyboard: [
          [{ text: '💪 Про спорт питание', callback_data: 'nutrition_video' }],
          [{ text: '🏆 Под ключ с Исламом', callback_data: 'coaching_video' }],
          [{ text: '📋 Заполнить заявку', callback_data: 'start_application' }]
        ]
      }
    });
  }
};

// Начать заявку
const startApplication = async (ctx: Context, chatId: number) => {
  applications.set(chatId.toString(), {
    step: 1,
    answers: {},
    createdAt: new Date().toISOString()
  });

  await ctx.telegram.sendMessage(chatId, 
    `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 1/6:\n\nИмя и возраст?\n\n*Пример:* Иван 25 лет`, {
    parse_mode: 'Markdown' as const,
    reply_markup: {
      inline_keyboard: [
        [{ text: '❌ Отменить заявку', callback_data: 'cancel_application' }]
      ]
    }
  });
};

// Обработка команды /start
bot.start(async (ctx) => {
  await showMainMenu(ctx);
});

// Обработка callback queries
bot.on('callback_query', async (ctx) => {
  const callbackQuery = ctx.callbackQuery as any;
  const callbackData = callbackQuery?.data;
  const chatId = callbackQuery?.message?.chat.id;
  const messageId = callbackQuery?.message?.message_id;

  if (!callbackData || !chatId) return;

  // Ответим на callback query чтобы убрать загрузку
  await ctx.answerCbQuery();

  let text = '';
  let replyMarkup: any;

  switch (callbackData) {
    case 'nutrition_video':
      text = NUTRITION_VIDEO_TEXT;
      replyMarkup = {
        inline_keyboard: [
          [{ text: '🏆 Под ключ с Исламом', callback_data: 'coaching_video' }],
          [{ text: '📋 Заполнить заявку', callback_data: 'start_application' }]
        ]
      };
      break;
    
    case 'coaching_video':
      text = COACHING_VIDEO_TEXT;
      replyMarkup = {
        inline_keyboard: [
          [{ text: '💪 Про спорт питание', callback_data: 'nutrition_video' }],
          [{ text: '📋 Заполнить заявку', callback_data: 'start_application' }]
        ]
      };
      break;
    
    case 'main_menu':
      await showMainMenu(ctx, chatId);
      return;
    
    case 'start_application':
      await startApplication(ctx, chatId);
      return;
    
    case 'cancel_application':
      applications.delete(chatId.toString());
      text = '❌ Заявка отменена';
      replyMarkup = {
        inline_keyboard: [
          [{ text: '📋 Главное меню', callback_data: 'main_menu' }]
        ]
      };
      break;
    
    default:
      return;
  }

  if (messageId && text) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown' as const,
      reply_markup: replyMarkup
    });
  } else if (text) {
    await ctx.telegram.sendMessage(chatId, text, {
      parse_mode: 'Markdown' as const,
      reply_markup: replyMarkup
    });
  }
});

// Обработка текстовых сообщений (для заявок)
bot.on('text', async (ctx) => {
  const messageText = ctx.message.text;
  const chatId = ctx.chat.id.toString();

  // Админ команды
  const ADMIN_ID = '1061591635';
  if (chatId === ADMIN_ID) {
    if (messageText === '/admin') {
      const appCount = applications.size;
      let responseText = `🔐 *АДМИН ПАНЕЛЬ*\n\n📊 Всего заявок: ${appCount}\n\n`;
      
      if (appCount === 0) {
        responseText += '❌ Нет заявок';
      } else {
        responseText += '📝 *СПИСОК ЗАЯВОК:*\n\n';
        let counter = 1;
        
        applications.forEach((app, appChatId) => {
          responseText += `${counter}. 👤 ID: \`${appChatId}\`\n`;
          responseText += `   📅 Дата: ${new Date(app.createdAt).toLocaleString('ru-RU')}\n`;
          responseText += `   📊 Шаг: ${app.step}\n`;
          
          if (app.answers && Object.keys(app.answers).length > 0) {
            responseText += `   ✅ Ответы:\n`;
            if (app.answers.nameAge) responseText += `      • Имя/Возраст: ${app.answers.nameAge}\n`;
            if (app.answers.heightWeight) responseText += `      • Рост/Вес: ${app.answers.heightWeight}\n`;
            if (app.answers.health) responseText += `      • Здоровье: ${app.answers.health}\n`;
            if (app.answers.goals) responseText += `      • Цели: ${app.answers.goals}\n`;
            if (app.answers.plansPharmacology) responseText += `      • План фарма: ${app.answers.plansPharmacology}\n`;
            if (app.answers.currentPharmacology) responseText += `      • Текущий фарма: ${app.answers.currentPharmacology}\n`;
          }
          
          responseText += '\n';
          counter++;
        });
      }
      
      await ctx.reply(responseText, { parse_mode: 'Markdown' as const });
      return;
    }
    
    if (messageText === '/clear') {
      applications.clear();
      await ctx.reply('✅ *ДАННЫЕ ОЧИЩЕНЫ*\n\nВсе заявки удалены из базы данных.', {
        parse_mode: 'Markdown' as const
      });
      return;
    }
  }

  // Обработка ответов в заявке
  const userApp = applications.get(chatId);
  if (userApp && messageText !== '/start') {
    const questions = [
      `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 2/6:\n\nРост и вес?\n\n*Пример:* 180 см 75 кг`,
      `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 3/6:\n\nУ тебя есть заболевания, травмы, аллергии или перенесенные операции?\n\n*Если нет, напиши "Нет"*`,
      `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 4/6:\n\nУ тебя есть цели и задачи на тренировочный процесс?\n\n*Пример:* набор массы, скинуть вес, рельеф`,
      `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 5/6:\n\nПланируете ли использовать фармакологию, SARMS?\n\n*Да/Нет*`,
      `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 6/6:\n\nЕсли да, то какие препараты и дозировки?\n\n*Если нет, напиши "Нет"*`
    ];
    
    const answerKeys = ['nameAge', 'heightWeight', 'health', 'goals', 'plansPharmacology', 'currentPharmacology'];
    
    if (userApp.step <= 6) {
      userApp.answers[answerKeys[userApp.step - 1]] = messageText;
      userApp.step++;
      
      if (userApp.step <= 6) {
        await ctx.reply(questions[userApp.step - 2], {
          parse_mode: 'Markdown' as const,
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ Отменить заявку', callback_data: 'cancel_application' }]
            ]
          }
        });
      } else {
        // Заявка завершена
        await ctx.reply('✅ *ЗАЯВКА ЗАВЕРШЕНА!*\n\nСпасибо! Мы свяжемся с вами в ближайшее время.', {
          parse_mode: 'Markdown' as const,
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Главное меню', callback_data: 'main_menu' }]
            ]
          }
        });
        applications.delete(chatId);
      }
      return;
    }
  }

  // Если не команда /start и не в заявке, покажем главное меню
  if (messageText !== '/start') {
    await showMainMenu(ctx);
  }
});

// Запуск бота
const startBot = async () => {
  try {
    await bot.launch();
    logger.info('✅ Telegram bot started successfully');
  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export { bot, startBot };
