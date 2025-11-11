const { Mastra } = require('@mastra/core');

const fitnessBot = Mastra.agent({
  name: 'fitness-bot',
  async execute({ context, tools }) {
    const telegram = tools.telegram;
    const payload = context.payload;

    // Тексты для видео-разделов
    const NUTRITION_VIDEO_TEXT = `🥗 *Видео про спорт питание*

📹 Смотрите как правильно питаться:

💪 *После просмотра:*
- Узнаете основы спортивного питания
- Поймете как сочетать продукты
- Научитесь планировать рацион

📞 *Для персональной программы:*
Wa.me/79222220217`;

    const COACHING_VIDEO_TEXT = `💪 *Видео про тренировки*

📹 Смотрите технику упражнений:

🏋️ *После просмотра:*
- Освоите правильную технику
- Узнаете про программу тренировок
- Поймете как прогрессировать

📞 *Для тренировок под ключ:*
Wa.me/79222220217`;

    // Обработка команды /start
    if (payload.message?.text === '/start') {
      try {
        // Сначала отправляем фото
        await telegram.sendPhoto({
          chat_id: payload.message.chat.id,
          photo: 'https://share.icloud.com/photos/035d4WW89u0KI4SRw86y0a1ZA',
          caption: `🏋️‍♂️ *Фитнес с Исламом*\n\nСун хаъ хьо дик форме ва луъш вуй! 💪`,
          parse_mode: 'Markdown'
        });
      } catch (error) {
        // Если фото не работает, отправляем только текст
        await telegram.sendMessage({
          chat_id: payload.message.chat.id,
          text: `🏋️‍♂️ *Фитнес с Исламом*\n\nСун хаъ хьо дик форме ва луъш вуй! 💪`,
          parse_mode: 'Markdown'
        });
      }

      // Затем отправляем кнопки
      await telegram.sendMessage({
        chat_id: payload.message.chat.id,
        text: "Выберите что вас интересует:",
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🥗 Спорт питание', callback_data: 'nutrition_video' },
              { text: '💪 Тренировки', callback_data: 'coaching_video' }
            ]
          ]
        }
      });
      return;
    }

    // Обработка callback кнопок
    if (payload.callback_query?.data) {
      const chatId = payload.callback_query.message?.chat.id;
      const messageId = payload.callback_query.message?.message_id;

      if (!chatId || !messageId) return;

      switch (payload.callback_query.data) {
        // 🥗 ПИТАНИЕ - видео
        case 'nutrition_video':
          await telegram.editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: NUTRITION_VIDEO_TEXT,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { 
                    text: '📹 СМОТРЕТЬ ВИДЕО ПИТАНИЯ', 
                    url: 'https://youtube.com/ВАШЕ_ВИДЕО_ПИТАНИЯ'
                  }
                ],
                [
                  { text: '💪 Хочу тренировки', callback_data: 'coaching_video' }
                ],
                [
                  { text: '📝 Оставить заявку', callback_data: 'application' },
                  { text: '🏠 Главное меню', callback_data: 'main_menu' }
                ]
              ]
            }
          });
          break;

        // 💪 ТРЕНИРОВКИ - видео
        case 'coaching_video':
          await telegram.editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: COACHING_VIDEO_TEXT,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { 
                    text: '📹 СМОТРЕТЬ ВИДЕО ТРЕНИРОВКИ', 
                    url: 'https://youtube.com/ВАШЕ_ВИДЕО_ТРЕНИРОВКИ'
                  }
                ],
                [
                  { text: '🥗 Хочу про питание', callback_data: 'nutrition_video' }
                ],
                [
                  { text: '📝 Оставить заявку', callback_data: 'application' },
                  { text: '🏠 Главное меню', callback_data: 'main_menu' }
                ]
              ]
            }
          });
          break;

        // 📝 ЗАЯВКА
        case 'application':
          await telegram.editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: `📝 *Оставить заявку*

Чтобы оставить заявку, напиши мне в WhatsApp сообщение:

Заявка от бота: [Имя] [Возраст] [Опыт тренировок]

📋 *Пример:*
«Заявка от бота: Ахмад 21 2 года»

✅ Я свяжусь с тобой в ближайшее время!`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📱 Написать в WhatsApp', url: 'https://wa.me/79222220217' }
                ],
                [
                  { text: '🥗 Питание', callback_data: 'nutrition_video' },
                  { text: '💪 Тренировки', callback_data: 'coaching_video' }
                ],
                [
                  { text: '🏠 Главное меню', callback_data: 'main_menu' }
                ]
              ]
            }
          });
          break;

        // 🏠 ГЛАВНОЕ МЕНЮ
        case 'main_menu':
          try {
            await telegram.sendPhoto({
              chat_id: chatId,
              photo: 'https://share.icloud.com/photos/035d4WW89u0KI4SRw86y0a1ZA',
              caption: `🏋️‍♂️ *Фитнес с Исламом*\n\nСун хаъ хьо дик форме ва луъш вуй! 💪`,
              parse_mode: 'Markdown'
            });
          } catch (error) {
            await telegram.sendMessage({
              chat_id: chatId,
              text: `🏋️‍♂️ *Фитнес с Исламом*\n\nСун хаъ хьо дик форме ва луъш вуй! 💪`,
              parse_mode: 'Markdown'
            });
          }

          await telegram.sendMessage({
            chat_id: chatId,
            text: "Выберите что вас интересует:",
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🥗 Спорт питание', callback_data: 'nutrition_video' },
                  { text: '💪 Тренировки', callback_data: 'coaching_video' }
                ]
              ]
            }
          });
          break;
      }
    }
  }
});

module.exports = { fitnessBot };
