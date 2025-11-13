import { startBot, logger } from './mastra/index.js';

const startApp = async (): Promise<void> => {
  try {
    logger.info('🚀 Starting Fitness Telegram Bot...');
    
    // Проверяем обязательные переменные
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
    
    // Запускаем бота
    await startBot();
    
    logger.info('✅ Application started successfully');
    
  } catch (error) {
    logger.error({ error }, '❌ Failed to start application');
    process.exit(1);
  }
};

// Запускаем приложение
startApp();
