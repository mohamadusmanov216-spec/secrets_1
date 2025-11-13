console.log('Запуск через index.ts');
import { startBot } from './triggers/telegramTriggers.js';
startBot().catch(console.error);
