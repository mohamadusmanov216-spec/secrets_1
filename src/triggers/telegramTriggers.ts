import { Telegraf, Context } from 'telegraf';
import pino from 'pino';

const logger = pino();

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

// Инициализация бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Главное меню
const showMainMenu = async (ctx: Context, chatId?: number) => {
  const targetChatId = chatId || ctx.chat?.id;
  if (!targetChatId) return;

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
};

// Обработка команды /start
bot.start(async (ctx) => {
  await showMainMenu(ctx);
});

// Обработка callback queries
// Обработка callback queries
bot.on('callback_query', async (ctx) => {
  const callbackQuery = ctx.callbackQuery as { data?: string; message?: any };
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
      text = `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 1/6:\n\nИмя и возраст?\n\n*Пример:* Иван 25 лет`;
      replyMarkup = {
        inline_keyboard: [
          [{ text: '❌ Отменить заявку', callback_data: 'cancel_application' }]
        ]
      };
      // Здесь можно добавить логику начала заявки
      break;
    
    case 'cancel_application':
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

  if (messageId) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown' as const,
      reply_markup: replyMarkup
    });
  } else {
    await ctx.telegram.sendMessage(chatId, text, {
      parse_mode: 'Markdown' as const,
      reply_markup: replyMarkup
    });
  }
});

// Обработка текстовых сообщений (для заявок)
bot.on('text', async (ctx) => {
  const messageText = ctx.message.text;
  const chatId = ctx.chat.id;

  // Админ команды
  const ADMIN_ID = 1061591635;
  if (chatId === ADMIN_ID) {
    if (messageText === '/admin') {
      // Логика админ панели
      await ctx.reply('🔐 Админ панель - функционал в разработке');
      return;
    }
    if (messageText === '/clear') {
      // Логика очистки данных
      await ctx.reply('✅ Данные очищены');
      return;
    }
  }

  // Если не команда /start, покажем главное меню
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
