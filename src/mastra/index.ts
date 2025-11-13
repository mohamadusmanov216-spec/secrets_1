import { Telegraf, Context } from 'telegraf';
import { WebClient } from '@slack/web-api';
import pino from 'pino';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Инициализация логгера
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Инициализация клиентов
const telegramBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN!);

// Базовые middleware для Telegram
telegramBot.use(async (ctx: Context, next: () => Promise<void>) => {
  const userId = ctx.from?.id;
  const updateType = ctx.updateType;
  
  logger.info({ userId, updateType }, 'Telegram update received');
  
  try {
    await next();
  } catch (error) {
    logger.error({ error, userId }, 'Error processing update');
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

// Обработчики команд Telegram
telegramBot.start((ctx: Context) => {
  const userName = ctx.from?.first_name || 'друг';
  ctx.reply(`🎉 Привет, ${userName}! Добро пожаловать в фитнес-бота!`);
});

telegramBot.help((ctx: Context) => {
  ctx.reply(`
📋 Доступные команды:
/start - Начать работу
/help - Помощь и команды
/fitness - Получить фитнес рекомендации
/progress - Отслеживание прогресса

💪 Начните с /fitness для персональных рекомендаций!
  `);
});

// Обработка текстовых сообщений
telegramBot.on('text', (ctx: Context) => {
  const message = ctx.message.text;
  
  if (message.toLowerCase().includes('привет')) {
    ctx.reply('Привет! 👋 Чем могу помочь?');
  } else if (message.toLowerCase().includes('спасибо')) {
    ctx.reply('Пожалуйста! 😊');
  } else {
    ctx.reply('Используйте /help для списка команд');
  }
});

// Запуск бота
const startBot = async (): Promise<void> => {
  try {
    logger.info('Starting Telegram bot...');
    await telegramBot.launch();
    logger.info('✅ Telegram bot started successfully');
  } catch (error) {
    logger.error({ error }, '❌ Failed to start Telegram bot');
    throw error;
  }
};

// Остановка бота
const stopBot = (reason: string): void => {
  logger.info(`Stopping bot: ${reason}`);
  telegramBot.stop(reason);
};

// Graceful shutdown
process.once('SIGINT', () => stopBot('SIGINT'));
process.once('SIGTERM', () => stopBot('SIGTERM'));

// Экспортируем для использования в src/index.ts
export { 
  telegramBot, 
  slackClient, 
  logger, 
  startBot,
  stopBot
};

export default {
  telegramBot,
  slackClient,
  logger,
  startBot,
  stopBot
};
