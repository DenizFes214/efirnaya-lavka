import express from 'express';
import cors from 'cors';
import db from './db.js';
import multer from 'multer';
import { dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Конфигурация Telegram бота
const BOT_TOKEN = process.env.BOT_TOKEN || '8340741653:AAGFC-nW1BnLobjhgXSKRjNY83HkU4pCqrw';
const ADMIN_IDS = ['985246360', '1562870920']; // Дарья и Алексей
const MAIN_CHANNEL_ID = '-1002261187486'; // Гримуар Ароматерапии
const TEST_CHANNEL_ID = '-1002277761715'; // Тестовый канал

// Инициализация бота
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

const app = express();
app.use(cors());

// Добавляем middleware для парсинга JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Определяем путь к frontend файлам
const frontendPath = process.env.NODE_ENV === 'production' 
  ? join(process.cwd(), 'frontend')  // В Docker: /app/frontend
  : join(__dirname, '..', 'frontend'); // Локально: ../frontend

// Middleware для проверки Telegram WebApp данных
const validateTelegramWebApp = (req, res, next) => {
  const initData = req.headers['x-telegram-init-data'];
  
  if (!initData) {
    return res.status(401).json({ error: 'Missing Telegram init data' });
  }

  try {
    // Парсим init data из Telegram WebApp
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Сортируем параметры и создаем строку для проверки
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Создаем ключ для проверки подписи
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash !== hash) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Парсим данные пользователя
    const user = JSON.parse(urlParams.get('user') || '{}');
    req.telegramUser = user;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid init data format' });
  }
};

// Middleware для проверки админских прав
const requireAdmin = (req, res, next) => {
  if (!req.telegramUser || !ADMIN_IDS.includes(req.telegramUser.id.toString())) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// === Healthcheck ===
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// === Настройка Multer для загрузки файлов ===
const uploadDir = process.env.UPLOADS_PATH || '/data/uploads';

// Создаем директорию для загрузок
const initUploadDir = async () => {
  try {
    // Создаем /data если не существует
    await mkdir('/data', { recursive: true });
    // Создаем /data/uploads если не существует
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.log('Директории уже существуют или созданы');
  }
};
initUploadDir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

app.use('/uploads', express.static(uploadDir));

// Статические файлы для фронтенда
app.use(express.static(frontendPath));

console.log(`📁 Serving static files from: ${frontendPath}`);

// === API: проверка админа ===
app.get('/api/admin/check', (req, res) => {
  const userId = req.query.user_id;
  res.json({ isAdmin: ADMIN_IDS.includes(userId.toString()) });
});

// === API: аутентификация пользователя ===
app.post('/api/auth/telegram', validateTelegramWebApp, (req, res) => {
  const user = req.telegramUser;
  
  // Сохраняем или обновляем пользователя в БД
  db.run(`
    INSERT OR REPLACE INTO users (telegram_id, username, first_name, last_name, is_admin, last_activity) 
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [
    user.id, 
    user.username || '', 
    user.first_name || '', 
    user.last_name || '', 
    ADMIN_IDS.includes(user.id.toString()) ? 1 : 0
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: ADMIN_IDS.includes(user.id.toString())
      }
    });
  });
});

// === API: категории ===
app.get('/api/categories', (_req, res) => {
  db.all('SELECT * FROM categories ORDER BY position, name', (e, rows) => {
    if (e) {
      console.error('Error fetching categories:', e);
      return res.status(500).json({ error: e.message });
    }
    res.json(rows || []);
  });
});

app.get('/api/categories/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM categories WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching category:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(row);
  });
});

app.get('/api/categories/:id/products', (req, res) => {
  const categoryId = req.params.id;
  db.all('SELECT * FROM products WHERE category_id = ? ORDER BY name', [categoryId], (err, rows) => {
    if (err) {
      console.error('Error fetching products by category:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// === API: товары ===
app.get('/api/products', (req, res) => {
  const catId = req.query.category_id;
  const sql = catId
    ? 'SELECT * FROM products WHERE category_id=? ORDER BY name'
    : 'SELECT * FROM products ORDER BY name';
  const args = catId ? [catId] : [];
  
  db.all(sql, args, (e, rows) => {
    if (e) {
      console.error('Error fetching products:', e);
      return res.status(500).json({ error: e.message });
    }
    res.json(rows || []);
  });
});

app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(row);
  });
});

// === API: корзина ===
app.get('/api/cart', validateTelegramWebApp, (req, res) => {
  const userId = req.telegramUser.id;
  
  db.all(`
    SELECT ci.*, p.name, p.price, p.image_url 
    FROM cart_items ci 
    JOIN products p ON ci.product_id = p.id 
    WHERE ci.user_telegram_id = ?
  `, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching cart:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.post('/api/cart', validateTelegramWebApp, (req, res) => {
  const userId = req.telegramUser.id;
  const { product_id, quantity = 1 } = req.body;
  
  if (!product_id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  
  db.run(`
    INSERT OR REPLACE INTO cart_items (user_telegram_id, product_id, quantity) 
    VALUES (?, ?, COALESCE((SELECT quantity FROM cart_items WHERE user_telegram_id = ? AND product_id = ?), 0) + ?)
  `, [userId, product_id, userId, product_id, quantity], function(err) {
    if (err) {
      console.error('Error adding to cart:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

app.delete('/api/cart/:productId', validateTelegramWebApp, (req, res) => {
  const userId = req.telegramUser.id;
  const productId = req.params.productId;
  
  db.run(
    'DELETE FROM cart_items WHERE user_telegram_id = ? AND product_id = ?',
    [userId, productId],
    function(err) {
      if (err) {
        console.error('Error removing from cart:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, deleted: this.changes });
    }
  );
});

// === API: заказы ===
app.post('/api/orders', validateTelegramWebApp, (req, res) => {
  try {
    const user = req.telegramUser;
    const { items = [], comment = '', delivery_method = 'pickup', delivery_address = '' } = req.body || {};
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    // Вычисляем общую стоимость
    const productIds = items.map(item => item.id);
    const placeholders = productIds.map(() => '?').join(',');
    
    db.all(`SELECT id, name, price FROM products WHERE id IN (${placeholders})`, productIds, (err, products) => {
      if (err) {
        console.error('Error fetching product prices:', err);
        return res.status(500).json({ error: 'Ошибка загрузки цен товаров' });
      }

      let total = 0;
      const validItems = [];

      items.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const itemTotal = product.price * item.quantity;
          total += itemTotal;
          validItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            total: itemTotal
          });
        }
      });

      if (validItems.length === 0) {
        return res.status(400).json({ error: 'Нет действительных товаров в корзине' });
      }
    
      db.run(
        'INSERT INTO orders(user_id, username, total, comment, delivery_method, delivery_address) VALUES(?,?,?,?,?,?)',
        [user.id, user.username || user.first_name, total, comment, delivery_method, delivery_address],
        function (err) {
          if (err) {
            console.error('Error creating order:', err);
            return res.status(500).json({ error: err.message });
          }
          
          const orderId = this.lastID;
          
          // Сохраняем товары в заказе
          const stmt = db.prepare('INSERT INTO order_items(order_id, product_id, name, price, qty) VALUES(?,?,?,?,?)');
          
          validItems.forEach(item => {
            stmt.run([orderId, item.id, item.name, item.price, item.quantity]);
          });
          
          stmt.finalize((err) => {
            if (err) {
              console.error('Error saving order items:', err);
              return res.status(500).json({ error: err.message });
            }
            
            // Очищаем корзину пользователя
            db.run('DELETE FROM cart_items WHERE user_telegram_id = ?', [user.id]);
            
            // Отправляем уведомление админам
            try {
              const itemsList = validItems.map(i => `${i.name} (x${i.quantity})`).join(', ');
              const message = `🛒 Новый заказ №${orderId}
              
👤 Заказчик: ${user.first_name} ${user.last_name || ''} (@${user.username || 'без username'})
📦 Товары: ${itemsList}
💰 Сумма: ${total}₽
📝 Комментарий: ${comment || 'нет'}
🚚 Доставка: ${delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}
${delivery_address ? `📍 Адрес: ${delivery_address}` : ''}`;

              bot.sendMessage(TEST_CHANNEL_ID, message);
            } catch (notificationError) {
              console.error('Error sending notification:', notificationError);
            }
            
            res.json({ 
              success: true,
              id: orderId,
              total: total 
            });
          });
        }
      );
    });
  } catch (error) {
    console.error('Unexpected error in order processing:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение заказов пользователя
app.get('/api/orders', validateTelegramWebApp, (req, res) => {
  const userId = req.telegramUser.id;
  
  db.all(`
    SELECT o.*, 
    (SELECT GROUP_CONCAT(oi.name || ' (x' || oi.qty || ')', ', ') 
     FROM order_items oi WHERE oi.order_id = o.id) as items_list
    FROM orders o 
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching user orders:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Обработчик корневого маршрута - отдаем главную страницу
app.get('/', (req, res) => {
  const indexPath = join(frontendPath, 'index.html');
  console.log(`📄 Serving index.html from: ${indexPath}`);
  res.sendFile(indexPath);
});

// Catch-all для SPA - все остальные маршруты тоже отдают index.html
app.get('*', (req, res) => {
  // Не перехватываем API маршруты
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = join(frontendPath, 'index.html');
  console.log(`📄 Serving SPA fallback from: ${indexPath}`);
  res.sendFile(indexPath);
});

// Запуск сервера
const PORT = process.env.PORT || 80;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🌿 Эфирная Лавка запущена на ${HOST}:${PORT}`);
});