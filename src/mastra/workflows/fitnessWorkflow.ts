import { Mastra } from "@mastra/core";

export const fitnessWorkflow = Mastra.workflow({
  id: "fitness-bot",
  name: "Fitness Bot Workflow", 
  async execute({ mastra, step, context }) {
    const { chatId, messageText, callbackData, messageId, userName } = context.inputData;

    const telegram = mastra.getTool('telegram');
    const ADMIN_ID = "1061591635"; // Твой ID для заявок

    // Хранилище для анкет (в памяти)
    const userApplications = new Map();

    // Тексты как в старом боте
    const NUTRITION_VIDEO_TEXT = `🥗 *СПОРТИВНОЕ ПИТАНИЕ*

📹 Смотрите как правильно питаться:

💪 *После просмотра:*
- Узнаете основы спортивного питания
- Поймете как сочетать продукты
- Научитесь планировать рацион

📞 *Для персональной программы:*
Wa.me/79222220217
*Напиши «Коуч» и получи 20% СКИДКУ!*`;

    const COACHING_VIDEO_TEXT = `💪 *ПОД КЛЮЧ С ИСЛАМОМ*

📹 Смотрите технику упражнений:

🏋️ *После просмотра:*
- Освоите правильную технику
- Узнаете про программу тренировок  
- Поймете как прогрессировать

📞 *Для тренировок под ключ:*
Wa.me/79222220217
*Напиши «Коуч» и получи 20% СКИДКУ!*`;

    // Функция отправки заявки админу
    async function sendApplicationToAdmin(userApp, userInfo) {
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
• От: @${userInfo.username || 'без username'}
• ID: ${userInfo.id}
• Время: ${new Date().toLocaleString('ru-RU')}`;

      await telegram.sendMessage(ADMIN_ID, applicationText, { parse_mode: 'Markdown' });
    }

    // Обработка /start
    if (messageText === '/start') {
      try {
        await telegram.sendPhoto({
          chat_id: chatId,
          photo: 'https://photos.app.goo.gl/cnkR5c1rV8FBcvXu7',
          caption: `🏋️‍♂️ *ФИТНЕС С ИСЛАМОМ*\n\nСун хаъ хьо дик форме ва луъш вуй!\n\nЙиаг ловш т1е йоьхаг товш волш хил везш ву НОХЧО\n\nПРЕИМУЩЕСТВА ТРЕНИРОВОК СО МНОЙ:\n\n• Мышечный масс набрать мух я ез\n• Вес скинуть мух я ез  \n• Спорт питание муьлхаг лело ез\n• Фармакологих лаьцна\n\nВай НОХЧИ къам г1арч аьл хилит луъш ар баькхан бу х1ар некъ!`,
          parse_mode: 'Markdown'
        });
      } catch (error) {
        await telegram.sendMessage({
          chat_id: chatId,
          text: `🏋️‍♂️ *ФИТНЕС С ИСЛАМОМ*\n\nСун хаъ хьо дик форме ва луъш вуй!\n\nЙиаг ловш т1е йоьхаг товш волш хил везш ву НОХЧО\n\nПРЕИМУЩЕСТВА ТРЕНИРОВОК СО МНОЙ:\n\n• Мышечный масс набрать мух я ез\n• Вес скинуть мух я ез  \n• Спорт питание муьлхаг лело ез\n• Фармакологих лаьцна\n\nВай НОХЧИ къам г1арч аьл хилит луъш ар баькхан бу х1ар некъ!`,
          parse_mode: 'Markdown'
        });
      }

      await telegram.sendMessage({
        chat_id: chatId,
        text: "ВЫБЕРИТЕ НАПРАВЛЕНИЕ:",
        parse_mode: 'Markdown', 
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🥗 СПОРТИВНОЕ ПИТАНИЕ', callback_data: 'nutrition_video' },
              { text: '💪 ПОД КЛЮЧ С ИСЛАМОМ', callback_data: 'coaching_video' }
            ],
            [
              { text: '📝 ЗАПОЛНИТЬ АНКЕТУ', callback_data: 'start_application' }
            ]
          ]
        }
      });
      return;
    }

    // Обработка текстовых сообщений (ответы в анкете)
    if (userApplications.has(chatId)) {
      const userApp = userApplications.get(chatId);
      const answer = messageText;

      // Сохраняем ответ и переходим к следующему вопросу
      const questions = [
        { text: `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 2/6:\n\nРост и вес?\n\n*Пример:* 180 см 75 кг` },
        { text: `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 3/6:\n\nУ тебя есть заболевания, травмы, аллергии или перенесенные операции?\n\n*Если нет, напиши "Нет"*` },
        { text: `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 4/6:\n\nУ тебя есть цели и задачи на тренировочный процесс?\n\n*Пример:* набор массы, скинуть вес, рельеф` },
        { text: `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 5/6:\n\nПланируете ли использовать фармакологию, SARMS?\n\n*Да/Нет*` },
        { text: `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 6/6:\n\nИспользуете ли вы фармакологию или SARMS сейчас? Если да, то какие препараты и дозировки?\n\n*Если нет, напиши "Нет"*` }
      ];

      const answerKeys = ['nameAge', 'heightWeight', 'health', 'goals', 'plansPharmacology', 'currentPharmacology'];

      if (userApp.step <= 5) {
        userApp.answers[answerKeys[userApp.step - 1]] = answer;
        userApp.step++;

        await telegram.sendMessage({
          chat_id: chatId,
          text: questions[userApp.step - 2].text,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❌ Отменить заявку', callback_data: 'cancel_application' }
              ]
            ]
          }
        });

      } else {
        // Последний вопрос
        userApp.answers.currentPharmacology = answer;

        // Отправляем заявку админу
        await sendApplicationToAdmin(userApp, {
          id: chatId,
          username: userName
        });

        // Удаляем анкету из хранилища
        userApplications.delete(chatId);

        await telegram.sendMessage({
          chat_id: chatId,
          text: `✅ *ЗАЯВКА ПРИНЯТА!*\n\nСпасибо за вашу заявку! Я свяжусь с вами в ближайшее время.\n\n💎 *БОНУС:* Напиши «Коуч» на Wa.me/79222220217 и получи 20% СКИДКУ!`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🏠 Главное меню', callback_data: 'main_menu' }
              ]
            ]
          }
        });
      }
      return;
    }

    // Обработка кнопок
    if (callbackData) {
      switch (callbackData) {
        case 'start_application':
          // Начинаем анкету
          userApplications.set(chatId, { step: 1, answers: {} });

          await telegram.editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: `📝 *АНКЕТА ДЛЯ ТРЕНИРОВОК*\n\nВопрос 1/6:\n\nВаше имя и возраст?\n\n*Пример:* Ахмад 21`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '❌ Отменить заявку', callback_data: 'cancel_application' }
                ]
              ]
            }
          });
          break;

        case 'cancel_application':
          userApplications.delete(chatId);
          await telegram.editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: `❌ *ЗАЯВКА ОТМЕНЕНА*\n\nВозвращайтесь, когда будете готовы начать тренировки!`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🏠 Главное меню', callback_data: 'main_menu' }
                ]
              ]
            }
          });
          break;

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
                    url: 'https://youtu.be/ct3l0gPaVQI?feature=shared'
                  }
                ],
                [
                  { text: '💪 ПОД КЛЮЧ С ИСЛАМОМ', callback_data: 'coaching_video' }
                ],
                [
                  { text: '📝 Заполнить анкету', callback_data: 'start_application' },
                  { text: '🏠 Главное меню', callback_data: 'main_menu' }
                ]
              ]
            }
          });
          break;

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
                    url: 'https://youtu.be/Z38azV8aDzI?feature=shared'
                  }
                ],
                [
                  { text: '🥗 СПОРТИВНОЕ ПИТАНИЕ', callback_data: 'nutrition_video' }
                ],
                [
                  { text: '📝 Заполнить анкету', callback_data: 'start_application' },
                  { text: '🏠 Главное меню', callback_data: 'main_menu' }
                ]
              ]
            }
          });
          break;

        case 'main_menu':
          try {
            await telegram.sendPhoto({
              chat_id: chatId,
              photo: 'https://photos.app.goo.gl/cnkR5c1rV8FBcvXu7',
              caption: `🏋️‍♂️ *ФИТНЕС С ИСЛАМОМ*\n\nСун хаъ хьо дик форме ва луъш вуй!\n\nЙиаг ловш т1е йоьхаг товш волш хил везш ву НОХЧО\n\nПРЕИМУЩЕСТВА ТРЕНИРОВОК СО МНОЙ:\n\n• Мышечный масс набрать мух я ез\n• Вес скинуть мух я ез  \n• Спорт питание муьлхаг лело ез\n• Фармакологих лаьцна\n\nВай НОХЧИ къам г1арч аьл хилит луъш ар баькхан бу х1ар некъ!`,
              parse_mode: 'Markdown'
            });
          } catch (error) {
            await telegram.sendMessage({
              chat_id: chatId,
              text: `🏋️‍♂️ *ФИТНЕС С ИСЛАМОМ*\n\nСун хаъ хьо дик форме ва луъш вуй!\n\nЙиаг ловш т1е йоьхаг товш волш хил везш ву НОХЧО\n\nПРЕИМУЩЕСТВА ТРЕНИРОВОК СО МНОЙ:\n\n• Мышечный масс набрать мух я ез\n• Вес скинуть мух я ез  \n• Спорт питание муьлхаг лело ез\n• Фармакологих лаьцна\n\nВай НОХЧИ къам г1арч аьл хилит луъш ар баькхан бу х1ар некъ!`,
              parse_mode: 'Markdown'
            });
          }

          await telegram.sendMessage({
            chat_id: chatId,
            text: "ВЫБЕРИТЕ НАПРАВЛЕНИЕ:",
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🥗 СПОРТИВНОЕ ПИТАНИЕ', callback_data: 'nutrition_video' },
                  { text: '💪 ПОД КЛЮЧ С ИСЛАМОМ', callback_data: 'coaching_video' }
                ],
                [
                  { text: '📝 ЗАПОЛНИТЬ АНКЕТУ', callback_data: 'start_application' }
                ]
              ]
            }
          });
          break;
      }
    }
  }
});