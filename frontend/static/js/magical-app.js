// 🌿 Эфирная Лавка - Главный магический скрипт ✨

class EtherealShop {
  constructor() {
    this.currentScreen = 'home';
    this.currentCategory = null;
    this.currentProduct = null;
    this.cart = JSON.parse(localStorage.getItem('ethereal_cart') || '[]');
    this.user = null;
    
    this.init();
  }

  async init() {
    try {
      // Ждем инициализации Telegram WebApp
      if (window.telegramApp) {
        await new Promise(resolve => {
          if (window.telegramApp.isInitialized) {
            resolve();
          } else {
            setTimeout(resolve, 500);
          }
        });
        
        // Аутентификация пользователя через Telegram
        await this.authenticateUser();
        
        // Настройка интерфейса для главной страницы
        window.telegramApp.setupForHome();
      }
      
      // Загрузка данных
      await this.loadCategories();
      this.updateCartCount();
      
      // Показываем главный экран
      this.showScreen('home');
      
    } catch (error) {
      console.error('Ошибка инициализации:', error);
      this.showNotification('⚠️ Ошибка соединения с магическими серверами');
    }
  }

  async authenticateUser() {
    if (!window.telegramApp || !window.telegramApp.isAvailable()) {
      console.warn('Telegram WebApp не доступен');
      return;
    }

    try {
      const initData = window.telegramApp.getInitData();
      
      if (!initData) {
        console.warn('Нет данных инициализации Telegram');
        return;
      }

      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        }
      });

      if (response.ok) {
        this.user = await response.json();
        
        // Показываем админ кнопку для администраторов
        if (this.user.user?.is_admin) {
          document.getElementById('adminButton').style.display = 'block';
        }
        
        // Приветственная вибрация
        window.telegramApp.hapticFeedback('light');
        
        console.log('🌿 Пользователь аутентифицирован:', this.user.user?.first_name);
      }
    } catch (error) {
      console.error('Ошибка аутентификации:', error);
    }
  }

  async loadCategories() {
    try {
      const response = await fetch('/api/categories');
      const categories = await response.json();
      
      this.renderCategories(categories);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  }

  renderCategories(categories) {
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = '';

    categories.forEach(category => {
      const categoryElement = this.createCategoryCard(category);
      grid.appendChild(categoryElement);
    });
  }

  createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card magical-glow';
    card.onclick = () => this.openCategory(category.id);

    const icon = this.getCategoryIcon(category.name);
    
    card.innerHTML = `
      <span class="category-icon">${icon}</span>
      <h3 class="category-title">${category.name}</h3>
      <p class="category-description">${category.description || ''}</p>
    `;

    return card;
  }

  getCategoryIcon(name) {
    const iconMap = {
      'Эфирные масла': '🌿',
      'Травы и сборы': '🌱', 
      'Ритуальные предметы': '🕯️',
      'Книги и руководства': '📚',
      'Услуги': '✨',
      'Натуральная косметика': '🧴'
    };
    
    return iconMap[name] || '🔮';
  }

  async openCategory(categoryId) {
    try {
      this.currentCategory = categoryId;
      
      const [categoryResponse, productsResponse] = await Promise.all([
        fetch(`/api/categories/${categoryId}`),
        fetch(`/api/categories/${categoryId}/products`)
      ]);

      const category = await categoryResponse.json();
      const products = await productsResponse.json();

      document.getElementById('categoryTitle').textContent = category.name;
      this.renderProducts(products);
      this.showScreen('catalog');

    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      this.showNotification('⚠️ Ошибка загрузки товаров');
    }
  }

  renderProducts(products) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    if (products.length === 0) {
      grid.innerHTML = '<p class="no-products">🔮 В этой категории пока нет товаров</p>';
      return;
    }

    products.forEach(product => {
      const productElement = this.createProductCard(product);
      grid.appendChild(productElement);
    });
  }

  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => this.openProduct(product.id);

    const imageSrc = product.image_url || '/static/icons/witch_broom.png';
    
    card.innerHTML = `
      <img src="${imageSrc}" alt="${product.name}" class="product-image" 
           onerror="this.src='/static/icons/witch_broom.png'">
      <div class="product-info">
        <h4 class="product-title">${product.name}</h4>
        <p class="product-description">${this.truncateText(product.description, 100)}</p>
        <div class="product-price">${product.price}₽</div>
        <button class="btn btn-secondary" onclick="event.stopPropagation(); etherealShop.addToCart(${product.id})">
          🛒 В корзину
        </button>
      </div>
    `;

    return card;
  }

  async openProduct(productId) {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const product = await response.json();
      
      this.currentProduct = product;
      this.renderProductDetails(product);
      this.showScreen('product');

    } catch (error) {
      console.error('Ошибка загрузки товара:', error);
      this.showNotification('⚠️ Ошибка загрузки товара');
    }
  }

  renderProductDetails(product) {
    const container = document.getElementById('productDetails');
    const imageSrc = product.image_url || '/static/icons/witch_broom.png';
    
    container.innerHTML = `
      <div class="product-detail">
        <img src="${imageSrc}" alt="${product.name}" class="product-detail-image"
             onerror="this.src='/static/icons/witch_broom.png'">
        
        <h2>${product.name}</h2>
        
        <div class="product-price-large">${product.price}₽</div>
        
        <div class="product-description-full">
          <h3>✨ Описание</h3>
          <p>${product.description}</p>
        </div>
        
        <div class="product-stock">
          <strong>Наличие:</strong> ${product.stock}
        </div>
        
        <div class="product-actions">
          <button class="btn" onclick="etherealShop.addToCart(${product.id})">
            🛒 Добавить в корзину
          </button>
          <button class="btn btn-secondary" onclick="etherealShop.showScreen('catalog')">
            ← Назад к каталогу
          </button>
        </div>
      </div>
    `;
  }

  addToCart(productId) {
    const existingItem = this.cart.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({ id: productId, quantity: 1 });
    }
    
    this.saveCart();
    this.updateCartCount();
    
    // Тактильная обратная связь
    if (window.telegramApp) {
      window.telegramApp.hapticFeedback('success');
    }
    
    this.showNotification('✨ Товар добавлен в корзину');
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
    this.updateCartCount();
    this.renderCart();
  }

  updateQuantity(productId, quantity) {
    const item = this.cart.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
      }
    }
  }

  saveCart() {
    localStorage.setItem('ethereal_cart', JSON.stringify(this.cart));
  }

  updateCartCount() {
    const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElement = document.getElementById('cartCount');
    
    if (count > 0) {
      countElement.textContent = count;
      countElement.style.display = 'inline-block';
    } else {
      countElement.style.display = 'none';
    }
  }

  async renderCart() {
    const container = document.getElementById('cartItems');
    
    if (this.cart.length === 0) {
      container.innerHTML = '<p class="empty-cart">🔮 Корзина пуста</p>';
      document.getElementById('cartSummary').style.display = 'none';
      return;
    }

    try {
      // Загружаем данные о товарах в корзине
      const productPromises = this.cart.map(item => 
        fetch(`/api/products/${item.id}`).then(r => r.json())
      );
      
      const products = await Promise.all(productPromises);
      
      container.innerHTML = '';
      let total = 0;

      products.forEach((product, index) => {
        const cartItem = this.cart[index];
        const itemTotal = product.price * cartItem.quantity;
        total += itemTotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item magical-container';
        itemElement.innerHTML = `
          <div class="cart-item-info">
            <img src="${product.image_url || '/static/icons/witch_broom.png'}" 
                 alt="${product.name}" class="cart-item-image">
            <div class="cart-item-details">
              <h4>${product.name}</h4>
              <p class="cart-item-price">${product.price}₽ × ${cartItem.quantity} = ${itemTotal}₽</p>
            </div>
          </div>
          <div class="cart-item-controls">
            <button onclick="etherealShop.updateQuantity(${product.id}, ${cartItem.quantity - 1})" class="btn btn-small">-</button>
            <span class="quantity">${cartItem.quantity}</span>
            <button onclick="etherealShop.updateQuantity(${product.id}, ${cartItem.quantity + 1})" class="btn btn-small">+</button>
            <button onclick="etherealShop.removeFromCart(${product.id})" class="btn btn-danger btn-small">🗑️</button>
          </div>
        `;
        
        container.appendChild(itemElement);
      });

      // Показываем итоги
      const summaryContainer = document.getElementById('cartSummary');
      summaryContainer.innerHTML = `
        <div class="cart-summary magical-container">
          <h3>📊 Итоги заказа</h3>
          <div class="summary-line">
            <span>Товаров:</span>
            <span>${this.cart.reduce((sum, item) => sum + item.quantity, 0)} шт.</span>
          </div>
          <div class="summary-line total">
            <span><strong>Итого:</strong></span>
            <span><strong>${total}₽</strong></span>
          </div>
          <button class="btn magical-glow" onclick="etherealShop.checkout()" 
                  style="width: 100%; margin-top: 1rem;">
            ✨ Оформить заказ
          </button>
        </div>
      `;
      summaryContainer.style.display = 'block';

    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
      container.innerHTML = '<p class="error">⚠️ Ошибка загрузки корзины</p>';
    }
  }

  async checkout() {
    if (this.cart.length === 0) {
      this.showNotification('⚠️ Корзина пуста');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': Telegram.WebApp?.initData || ''
        },
        body: JSON.stringify({
          items: this.cart
        })
      });

      if (response.ok) {
        const order = await response.json();
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
        
        this.showNotification('✨ Заказ успешно оформлен!');
        this.showScreen('orders');
      } else {
        throw new Error('Ошибка оформления заказа');
      }

    } catch (error) {
      console.error('Ошибка оформления заказа:', error);
      this.showNotification('⚠️ Ошибка оформления заказа');
    }
  }

  showScreen(screenName) {
    // Скрываем все экраны
    const screens = ['loadingScreen', 'homeScreen', 'catalogScreen', 'productScreen', 'cartScreen', 'ordersScreen'];
    screens.forEach(screen => {
      const element = document.getElementById(screen);
      if (element) element.style.display = 'none';
    });

    // Обновляем навигацию
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Показываем нужный экран
    let targetScreen;
    switch(screenName) {
      case 'home':
        targetScreen = 'homeScreen';
        document.getElementById('nav-home')?.classList.add('active');
        if (window.telegramApp) {
          window.telegramApp.setupForHome();
        }
        break;
      case 'catalog':
        targetScreen = 'catalogScreen';
        document.getElementById('nav-catalog')?.classList.add('active');
        if (window.telegramApp) {
          window.telegramApp.setupForCatalog();
        }
        break;
      case 'product':
        targetScreen = 'productScreen';
        if (window.telegramApp && this.currentProduct) {
          window.telegramApp.setupForProduct(this.currentProduct.name);
        }
        break;
      case 'cart':
        targetScreen = 'cartScreen';
        document.getElementById('nav-cart')?.classList.add('active');
        this.renderCart();
        if (window.telegramApp) {
          const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
          window.telegramApp.setupForCart(itemCount);
        }
        break;
      case 'orders':
        targetScreen = 'ordersScreen';
        document.getElementById('nav-orders')?.classList.add('active');
        this.loadOrders();
        if (window.telegramApp) {
          window.telegramApp.hideMainButton();
          window.telegramApp.showBackButton();
        }
        break;
    }

    if (targetScreen) {
      document.getElementById(targetScreen).style.display = 'block';
    }

    this.currentScreen = screenName;
    
    // Тактильная обратная связь при переключении экранов
    if (window.telegramApp) {
      window.telegramApp.hapticFeedback('light');
    }
  }

  async loadOrders() {
    const container = document.getElementById('ordersList');
    
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'x-telegram-init-data': Telegram.WebApp?.initData || ''
        }
      });

      if (response.ok) {
        const orders = await response.json();
        this.renderOrders(orders);
      } else {
        throw new Error('Ошибка загрузки заказов');
      }

    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      container.innerHTML = '<p class="error">⚠️ Ошибка загрузки заказов</p>';
    }
  }

  renderOrders(orders) {
    const container = document.getElementById('ordersList');
    
    if (orders.length === 0) {
      container.innerHTML = '<p class="no-orders">📜 Заказов пока нет</p>';
      return;
    }

    container.innerHTML = '';
    
    orders.forEach(order => {
      const orderElement = document.createElement('div');
      orderElement.className = 'order-item magical-container';
      orderElement.innerHTML = `
        <div class="order-header">
          <h4>Заказ №${order.id}</h4>
          <span class="order-status status-${order.status}">${this.getOrderStatusText(order.status)}</span>
        </div>
        <div class="order-info">
          <p><strong>Дата:</strong> ${new Date(order.created_at).toLocaleString()}</p>
          <p><strong>Сумма:</strong> ${order.total}₽</p>
        </div>
      `;
      
      container.appendChild(orderElement);
    });
  }

  getOrderStatusText(status) {
    const statusMap = {
      'new': 'Новый',
      'processing': 'В обработке',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'cancelled': 'Отменён'
    };
    
    return statusMap[status] || status;
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

// Глобальные функции для навигации
function showScreen(screenName) {
  if (window.etherealShop) {
    window.etherealShop.showScreen(screenName);
  }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  window.etherealShop = new EtherealShop();
});