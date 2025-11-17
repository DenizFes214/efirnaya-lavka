/**
 * 🌿 Эфирная Лавка - Telegram MiniApp Initialization
 * Современная инициализация с @telegram-apps/sdk 2.x
 */

// Импорт современного Telegram Apps SDK
import { 
  initData,
  miniApp,
  themeParams,
  viewport,
  mainButton,
  backButton,
  hapticFeedback,
  cloudStorage,
  init as initSDK
} from '@tma.js/sdk';

class EfirnayaLavkaTMA {
  constructor() {
    this.isInitialized = false;
    this.user = null;
    this.cart = [];
    
    console.log('🌿 Инициализация Эфирной Лавки...');
    this.init();
  }

  /**
   * Основная инициализация MiniApp
   */
  async init() {
    try {
      // Инициализация SDK
      initSDK();
      
      if (miniApp.mount.isAvailable()) {
        miniApp.mount();
        console.log('✅ Telegram SDK инициализирован');
        
        // Настройка viewport
        await this.setupViewport();
        
        // Настройка темы
        await this.setupTheme();
        
        // Инициализация пользователя
        await this.setupUser();
        
        // Настройка кнопок
        await this.setupButtons();
        
        // Настройка тактильной обратной связи
        await this.setupHaptics();
        
        // Загрузка корзины из облачного хранилища
        await this.loadCartFromCloud();
        
        this.isInitialized = true;
        console.log('🎉 Эфирная Лавка готова к работе!');
        
        // Уведомляем приложение о готовности
        window.dispatchEvent(new CustomEvent('tmaReady', { 
          detail: { user: this.user } 
        }));
        
      } else {
        console.warn('⚠️ Не удалось инициализировать Telegram SDK');
        this.fallbackMode();
      }
      
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      this.fallbackMode();
    }
  }

  /**
   * Настройка viewport
   */
  async setupViewport() {
    try {
      if (viewport.mount.isAvailable()) {
        viewport.mount();
        
        // Разворачиваем на весь экран
        if (viewport.expand.isAvailable()) {
          viewport.expand();
        }
        
        console.log('📱 Viewport настроен');
      }
    } catch (error) {
      console.error('Ошибка настройки viewport:', error);
    }
  }

  /**
   * Настройка темы
   */
  async setupTheme() {
    try {
      if (themeParams.mount.isAvailable()) {
        themeParams.mount();
        
        // Применяем тему Telegram к нашему приложению
        const theme = themeParams.get();
        this.applyTelegramTheme(theme);
        
        console.log('🎨 Тема применена:', theme);
      }
    } catch (error) {
      console.error('Ошибка настройки темы:', error);
    }
  }

  /**
   * Инициализация пользователя
   */
  async setupUser() {
    try {
      if (initData.restore.isAvailable()) {
        initData.restore();
        
        const data = initData.get();
        if (data?.user) {
          this.user = data.user;
          console.log('👤 Пользователь:', this.user.firstName, this.user.lastName);
          
          // Отправляем данные на сервер для авторизации
          await this.authenticateUser(initData.raw());
        }
      }
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
    }
  }

  /**
   * Настройка кнопок
   */
  async setupButtons() {
    try {
      // Главная кнопка
      if (mainButton.mount.isAvailable()) {
        mainButton.mount();
        
        // Скрываем по умолчанию
        mainButton.hide();
        
        // Обработчик нажатия
        mainButton.onClick(() => {
          this.handleMainButtonClick();
        });
        
        console.log('🔘 Главная кнопка настроена');
      }
      
      // Кнопка назад
      if (backButton.mount.isAvailable()) {
        backButton.mount();
        
        // Скрываем по умолчанию  
        backButton.hide();
        
        // Обработчик нажатия
        backButton.onClick(() => {
          this.handleBackButtonClick();
        });
        
        console.log('⬅️ Кнопка назад настроена');
      }
      
    } catch (error) {
      console.error('Ошибка настройки кнопок:', error);
    }
  }

  /**
   * Настройка тактильной обратной связи
   */
  async setupHaptics() {
    try {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        this.haptics = hapticFeedback;
        console.log('📳 Тактильная обратная связь активна');
      }
    } catch (error) {
      console.error('Ошибка настройки тактильной обратной связи:', error);
    }
  }

  /**
   * Загрузка корзины из облачного хранилища
   */
  async loadCartFromCloud() {
    try {
      if (cloudStorage.getItem.isAvailable()) {
        const cartData = await cloudStorage.getItem('cart');
        if (cartData) {
          this.cart = JSON.parse(cartData);
          console.log('🛒 Корзина загружена из облака:', this.cart.length, 'товаров');
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
    }
  }

  /**
   * Сохранение корзины в облачное хранилище
   */
  async saveCartToCloud() {
    try {
      if (cloudStorage.setItem.isAvailable()) {
        await cloudStorage.setItem('cart', JSON.stringify(this.cart));
        console.log('💾 Корзина сохранена в облако');
      }
    } catch (error) {
      console.error('Ошибка сохранения корзины:', error);
    }
  }

  /**
   * Авторизация пользователя на сервере
   */
  async authenticateUser(initDataRaw) {
    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initDataRaw
        },
        body: JSON.stringify({ initData: initDataRaw })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔐 Авторизация успешна:', result.user?.first_name);
        
        // Проверяем админские права
        this.checkAdminStatus(result.user?.id);
        
      } else {
        console.error('❌ Ошибка авторизации:', response.status);
      }
      
    } catch (error) {
      console.error('❌ Ошибка запроса авторизации:', error);
    }
  }

  /**
   * Проверка админских прав
   */
  async checkAdminStatus(userId) {
    try {
      const response = await fetch(`/api/admin/check?user_id=${userId}`);
      const result = await response.json();
      
      if (result.isAdmin) {
        console.log('👑 Админские права подтверждены');
        document.body.classList.add('admin-mode');
        
        // Показываем админскую кнопку
        this.showAdminButton();
      }
      
    } catch (error) {
      console.error('Ошибка проверки админских прав:', error);
    }
  }

  /**
   * Применение темы Telegram к приложению
   */
  applyTelegramTheme(theme) {
    const root = document.documentElement;
    
    // Применяем цвета темы
    if (theme.bgColor) {
      root.style.setProperty('--tg-bg-color', theme.bgColor);
    }
    
    if (theme.textColor) {
      root.style.setProperty('--tg-text-color', theme.textColor);
    }
    
    if (theme.buttonColor) {
      root.style.setProperty('--tg-button-color', theme.buttonColor);
    }
    
    if (theme.buttonTextColor) {
      root.style.setProperty('--tg-button-text-color', theme.buttonTextColor);
    }
    
    // Добавляем класс темы
    document.body.classList.add(theme.colorScheme === 'dark' ? 'dark-theme' : 'light-theme');
  }

  /**
   * Обработчик главной кнопки
   */
  handleMainButtonClick() {
    if (this.cart.length > 0) {
      // Переход к оформлению заказа
      this.triggerHaptic('medium');
      window.location.hash = '#checkout';
    }
  }

  /**
   * Обработчик кнопки назад
   */
  handleBackButtonClick() {
    this.triggerHaptic('light');
    window.history.back();
  }

  /**
   * Показать главную кнопку (например, "Оформить заказ")
   */
  showMainButton(text = '🛒 Оформить заказ', color = '#2ea043') {
    if (mainButton.setText.isAvailable()) {
      mainButton.setText(text);
    }
    
    if (mainButton.setParams.isAvailable()) {
      mainButton.setParams({ color, textColor: '#ffffff' });
    }
    
    if (mainButton.show.isAvailable()) {
      mainButton.show();
    }
  }

  /**
   * Скрыть главную кнопку
   */
  hideMainButton() {
    if (mainButton.hide.isAvailable()) {
      mainButton.hide();
    }
  }

  /**
   * Показать кнопку назад
   */
  showBackButton() {
    if (backButton.show.isAvailable()) {
      backButton.show();
    }
  }

  /**
   * Скрыть кнопку назад
   */
  hideBackButton() {
    if (backButton.hide.isAvailable()) {
      backButton.hide();
    }
  }

  /**
   * Показать админскую кнопку
   */
  showAdminButton() {
    const adminBtn = document.createElement('button');
    adminBtn.className = 'admin-panel-btn';
    adminBtn.innerHTML = '👑 Админ панель';
    adminBtn.onclick = () => {
      this.triggerHaptic('heavy');
      window.location.href = '/admin.html';
    };
    
    document.body.appendChild(adminBtn);
  }

  /**
   * Тактильная обратная связь
   */
  triggerHaptic(type = 'light') {
    try {
      if (this.haptics?.impactOccurred.isAvailable()) {
        this.haptics.impactOccurred(type);
      }
    } catch (error) {
      console.error('Ошибка тактильной обратной связи:', error);
    }
  }

  /**
   * Управление корзиной
   */
  addToCart(product) {
    this.cart.push({
      ...product,
      addedAt: Date.now()
    });
    
    this.saveCartToCloud();
    this.updateCartUI();
    this.triggerHaptic('medium');
    
    console.log('🛒 Товар добавлен в корзину:', product.name);
  }

  removeFromCart(productId) {
    const index = this.cart.findIndex(item => item.id === productId);
    if (index > -1) {
      this.cart.splice(index, 1);
      this.saveCartToCloud();
      this.updateCartUI();
      this.triggerHaptic('light');
      
      console.log('🗑️ Товар удален из корзины:', productId);
    }
  }

  /**
   * Обновление UI корзины
   */
  updateCartUI() {
    // Обновляем счетчик
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
      cartCount.textContent = this.cart.length;
      cartCount.style.display = this.cart.length > 0 ? 'block' : 'none';
    }
    
    // Показываем/скрываем главную кнопку
    if (this.cart.length > 0) {
      this.showMainButton(`🛒 Оформить заказ (${this.cart.length})`);
    } else {
      this.hideMainButton();
    }
  }

  /**
   * Fallback режим для работы вне Telegram
   */
  fallbackMode() {
    console.log('🔄 Запуск в fallback режиме');
    
    // Создаем mock пользователя
    this.user = {
      id: 12345,
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser'
    };
    
    // Показываем предупреждение
    const notice = document.createElement('div');
    notice.className = 'telegram-notice';
    notice.innerHTML = '⚠️ Для полной функциональности откройте приложение через Telegram';
    document.body.prepend(notice);
    
    this.isInitialized = true;
    
    window.dispatchEvent(new CustomEvent('tmaReady', { 
      detail: { user: this.user, fallback: true } 
    }));
  }

  /**
   * Закрытие MiniApp
   */
  close() {
    if (miniApp.close.isAvailable()) {
      miniApp.close();
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  window.EfirnayaLavka = new EfirnayaLavkaTMA();
});

// Экспорт для использования в других модулях
window.TMA = {
  isReady: () => window.EfirnayaLavka?.isInitialized || false,
  getUser: () => window.EfirnayaLavka?.user || null,
  addToCart: (product) => window.EfirnayaLavka?.addToCart(product),
  removeFromCart: (productId) => window.EfirnayaLavka?.removeFromCart(productId),
  triggerHaptic: (type) => window.EfirnayaLavka?.triggerHaptic(type),
  showMainButton: (text, color) => window.EfirnayaLavka?.showMainButton(text, color),
  hideMainButton: () => window.EfirnayaLavka?.hideMainButton(),
  showBackButton: () => window.EfirnayaLavka?.showBackButton(),
  hideBackButton: () => window.EfirnayaLavka?.hideBackButton(),
  close: () => window.EfirnayaLavka?.close()
};