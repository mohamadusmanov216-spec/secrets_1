import { startBot } from './triggers/telegramTriggers.js';

const startApp = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Fitness Telegram Bot...');
    
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
    
    await startBot();
    
    console.log('✅ Application started successfully');
    
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};

// Запускаем приложение
startApp();
