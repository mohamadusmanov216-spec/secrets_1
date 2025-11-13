import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start((ctx) => {
  ctx.reply('🎉 Бот работает!');
});

bot.launch().then(() => {
  console.log('✅ Бот запущен!');
});
