// 🌿 Telegram WebApp инициализация для Эфирной Лавки ✨

class TelegramWebAppIntegration {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.user = null;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    if (!this.tg) {
      console.warn('Telegram WebApp не доступен');
      return;
    }

    try {
      // Основная инициализация
      this.tg.ready();
      this.tg.expand();
      
      // Настройка темы приложения
      this.setupTheme();
      
      // Получение данных пользователя
      this.user = this.tg.initDataUnsafe?.user;
      
      // Настройка кнопок
      this.setupMainButton();
      this.setupBackButton();
      
      // Включение тактильной обратной связи
      this.tg.enableClosingConfirmation();
      
      // Настройка заголовка
      this.tg.setHeaderColor('#2d1810'); // Темно-коричневый цвет лавки
      
      this.isInitialized = true;
      console.log('🔮 Telegram WebApp инициализирован для Эфирной Лавки');
      
    } catch (error) {
      console.error('Ошибка инициализации Telegram WebApp:', error);
    }
  }

  setupTheme() {
    if (!this.tg) return;

    // Устанавливаем магические цвета темы
    const themeParams = {
      bg_color: '#2d1810',           // Темно-коричневый фон
      text_color: '#f5f1e8',        // Кремовый текст
      hint_color: '#7d8c7d',        // Светло-зеленый для подсказок
      link_color: '#d4af37',        // Золотой для ссылок
      button_color: '#d4af37',      // Золотая кнопка
      button_text_color: '#2d1810', // Темный текст на кнопке
      secondary_bg_color: '#4a2c1a' // Коричневый для вторичного фона
    };

    // Применяем тему
    if (this.tg.setBackgroundColor) {
      this.tg.setBackgroundColor(themeParams.bg_color);
    }
  }

  setupMainButton() {
    if (!this.tg?.MainButton) return;

    // Скрываем главную кнопку по умолчанию
    this.tg.MainButton.hide();
    
    // Настраиваем стиль кнопки
    this.tg.MainButton.setParams({
      color: '#d4af37',
      text_color: '#2d1810'
    });
  }

  setupBackButton() {
    if (!this.tg?.BackButton) return;

    // Настраиваем кнопку "Назад"
    this.tg.BackButton.onClick(() => {
      // Логика возврата назад по экранам приложения
      if (window.etherealShop) {
        const currentScreen = window.etherealShop.currentScreen;
        
        switch (currentScreen) {
          case 'product':
            window.etherealShop.showScreen('catalog');
            break;
          case 'catalog':
            window.etherealShop.showScreen('home');
            break;
          default:
            // Если на главной странице, закрываем приложение
            this.tg.close();
        }
      }
    });
  }

  // Показать главную кнопку с текстом и действием
  showMainButton(text, onClick) {
    if (!this.tg?.MainButton) return;

    this.tg.MainButton.setParams({
      text: text,
      is_visible: true,
      is_active: true
    });

    this.tg.MainButton.onClick(onClick);
    this.tg.MainButton.show();
  }

  // Скрыть главную кнопку
  hideMainButton() {
    if (this.tg?.MainButton) {
      this.tg.MainButton.hide();
    }
  }

  // Показать/скрыть кнопку "Назад"
  showBackButton() {
    if (this.tg?.BackButton) {
      this.tg.BackButton.show();
    }
  }

  hideBackButton() {
    if (this.tg?.BackButton) {
      this.tg.BackButton.hide();
    }
  }

  // Тактильная обратная связь
  hapticFeedback(type = 'light') {
    if (this.tg?.HapticFeedback) {
      switch (type) {
        case 'light':
          this.tg.HapticFeedback.impactOccurred('light');
          break;
        case 'medium':
          this.tg.HapticFeedback.impactOccurred('medium');
          break;
        case 'heavy':
          this.tg.HapticFeedback.impactOccurred('heavy');
          break;
        case 'success':
          this.tg.HapticFeedback.notificationOccurred('success');
          break;
        case 'warning':
          this.tg.HapticFeedback.notificationOccurred('warning');
          break;
        case 'error':
          this.tg.HapticFeedback.notificationOccurred('error');
          break;
      }
    }
  }

  // Показать всплывающее уведомление
  showAlert(message) {
    if (this.tg?.showAlert) {
      this.tg.showAlert(message);
    } else {
      alert(message);
    }
  }

  // Показать подтверждение
  showConfirm(message, callback) {
    if (this.tg?.showConfirm) {
      this.tg.showConfirm(message, callback);
    } else {
      const result = confirm(message);
      callback(result);
    }
  }

  // Отправить данные в бота
  sendData(data) {
    if (this.tg?.sendData) {
      this.tg.sendData(JSON.stringify(data));
    }
  }

  // Получить данные пользователя
  getUser() {
    return this.user;
  }

  // Получить данные инициализации
  getInitData() {
    return this.tg?.initData || '';
  }

  // Проверка доступности платформы
  isAvailable() {
    return !!this.tg;
  }

  // Закрыть приложение
  close() {
    if (this.tg?.close) {
      this.tg.close();
    }
  }

  // Расширить приложение на весь экран
  expand() {
    if (this.tg?.expand) {
      this.tg.expand();
    }
  }

  // Настройка для корзины
  setupForCart(itemCount) {
    if (itemCount > 0) {
      this.showMainButton(`✨ Оформить заказ (${itemCount})`, () => {
        if (window.etherealShop) {
          window.etherealShop.checkout();
        }
      });
    } else {
      this.hideMainButton();
    }
  }

  // Настройка для товара
  setupForProduct(productName) {
    this.showMainButton(`🛒 Добавить в корзину`, () => {
      this.hapticFeedback('success');
      // Действие будет обработано в основном приложении
    });
  }

  // Настройка для каталога
  setupForCatalog() {
    this.hideMainButton();
    this.showBackButton();
  }

  // Настройка для главной страницы
  setupForHome() {
    this.hideMainButton();
    this.hideBackButton();
  }
}

// Создаем глобальный экземпляр
window.telegramApp = new TelegramWebAppIntegration();

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TelegramWebAppIntegration;
}
