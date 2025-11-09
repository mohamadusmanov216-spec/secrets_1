const { Mastra } = require('@mastra/core');
const { TelegramTool } = require('@mastra/telegram');

const fitnessBot = Mastra.agent({
  name: 'fitness-bot',
  tools: [TelegramTool],
  async execute({ context, tools }) {
    const telegram = tools.telegram;

    // Текстовые константы
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

    // Обработка команды /start
    if (context.message?.text === '/start') {
      await telegram.sendMessage({
        chat_id: context.message.chat.id,
        text: MAIN_TEXT,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🥗 Про спорт питание', callback_data: 'nutrition' },
              { text: '💪 Под ключ с Исламом', callback_data: 'coaching' }
            ],
            [{ text: '📞 Связаться', url: 'https://wa.me/79222220217' }]
          ]
        }
      });
    }

    // Обработка callback кнопок
    if (context.callback_query) {
      const chatId = context.callback_query.message?.chat.id;
      const messageId = context.callback_query.message?.message_id;

      if (!chatId || !messageId) return;

      switch (context.callback_query.data) {
        case 'nutrition':
          await telegram.editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: NUTRITION_TEXT,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '💪 Тренировки', callback_data: 'coaching' },
                  { text: '📝 Оставить заявку', callback_data: 'application' }
                ],
                [{ text: '📞 Связаться', url: 'https://wa.me/79222220217' }],
                [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
              ]
            }
          });
          break;

        case 'coaching':
          await telegram.editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: COACHING_TEXT,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🥗 Питание', callback_data: 'nutrition' },
                  { text: '📝 Оставить заявку', callback_data: 'application' }
                ],
                [{ text: '📞 Связаться', url: 'https://wa.me/79222220217' }],
                [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
              ]
            }
          });
          break;

        case 'application':
          await telegram.editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: APPLICATION_TEXT,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📱 Написать в WhatsApp', url: 'https://wa.me/79222220217' }],
                [
                  { text: '🥗 Питание', callback_data: 'nutrition' },
                  { text: '💪 Тренировки', callback_data: 'coaching' }
                ],
                [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
              ]
            }
          });
          break;

        case 'main_menu':
          await telegram.editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: MAIN_TEXT,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🥗 Про спорт питание', callback_data: 'nutrition' },
                  { text: '💪 Под ключ с Исламом', callback_data: 'coaching' }
                ],
                [{ text: '📞 Связаться', url: 'https://wa.me/79222220217' }]
              ]
            }
          });
          break;
      }
    }
  }
});

module.exports = { fitnessBot };