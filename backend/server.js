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
const ADMIN_IDS = ['985246360', '1562870920'];
const MAIN_CHANNEL_ID = '-1002261187486';
const TEST_CHANNEL_ID = '-1002277761715';

// Инициализация бота
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(join(__dirname, '../uploads')));
app.use(express.static(join(__dirname, '../frontend')));

// Валидация Telegram Web App
function validateTelegramWebApp(req, res, next) {
  const initData = req.headers.authorization;
  
  if (!initData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const urlParams = new URLSearchParams(initData.replace('tma ', ''));
    const hash = urlParams.get('hash');
    const authDate = urlParams.get('auth_date');
    
    urlParams.delete('hash');
    
    if (Math.abs(Date.now() / 1000 - parseInt(authDate)) > 86400) {
      return res.status(401).json({ error: 'Auth data expired' });
    }

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      return res.status(401).json({ error: 'Invalid hash' });
    }

    const userParam = urlParams.get('user');
    if (userParam) {
      req.telegramUser = JSON.parse(decodeURIComponent(userParam));
    }
    
    next();
  } catch (error) {
    console.error('Auth validation error:', error);
    return res.status(401).json({ error: 'Invalid auth data' });
  }
}

// Базовые маршруты
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, '../frontend/admin.html'));
});

// API товаров
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, row) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json(row);
  });
});

// API заказов
app.post('/api/orders', validateTelegramWebApp, (req, res) => {
  try {
    const user = req.telegramUser;
    const { items = [], comment = '', delivery_method = 'pickup', delivery_address = '' } = req.body || {};
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

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
          
          const stmt = db.prepare('INSERT INTO order_items(order_id, product_id, name, price, qty) VALUES(?,?,?,?,?)');
          
          try {
            validItems.forEach(item => {
              stmt.run(orderId, item.id, item.name, item.price, item.quantity);
            });
            stmt.finalize();
            
            db.run('DELETE FROM cart_items WHERE user_telegram_id = ?', [user.id]);
            
            // Отправка уведомлений согласно PROMPT.md
            try {
              const deliveryText = delivery_method === 'pickup' ? 'Самовывоз' : 
                                 delivery_method === 'post' ? 'Почта России' :
                                 delivery_method === 'yandex' ? 'Яндекс доставка' : 'Доставка';

              const adminMessage = `🔮 Великая Мастерица! 🌟
Поступил заказ от ${user.first_name} ${user.last_name || ''} (@${user.username || 'безымянный_странник'}):

✨ ЗАКАЗАННЫЕ ЗЕЛЬЯ:
${validItems.map(i => `• ${i.name} - ${i.quantity} шт. по ${i.price}₽`).join('\n')}

💰 Общая сумма: ${total}₽
🧙‍♀️ Время заказа: ${new Date().toLocaleString('ru-RU')}
📦 Способ получения: ${deliveryText}
${delivery_address ? `📍 Адрес доставки: ${delivery_address}` : ''}
${comment ? `💭 Пожелания путника: ${comment}` : ''}`;

              bot.sendMessage('985246360', adminMessage);
              
              const userMessage = `🌟 Благодарим за доверие к Эфирной Лавке! 🌟

Ваш заказ №${orderId} принят в работу:
${validItems.map(i => `• ${i.name} - ${i.quantity} шт.`).join('\n')}

💰 К оплате: ${total}₽

🔮 Скоро мы свяжемся с вами для уточнения деталей!
✨ Пусть ароматы приносят вам магию каждый день!`;

              bot.sendMessage(user.id, userMessage);

              bot.sendMessage(TEST_CHANNEL_ID, `📊 Заказ №${orderId} оформлен\nПользователь: ${user.first_name}\nТоваров: ${validItems.length}\nСумма: ${total}₽`);
              
            } catch (notificationError) {
              console.error('Error sending notification:', notificationError);
            }
            
            res.json({ 
              success: true,
              id: orderId,
              total: total 
            });
          } catch (stmtError) {
            console.error('Error saving order items:', stmtError);
            return res.status(500).json({ error: 'Ошибка сохранения заказа' });
          }
        }
      );
    });
  } catch (error) {
    console.error('Unexpected error in order processing:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

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

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌿 Эфирная Лавка запущена на порту ${PORT}`);
});

export default app;