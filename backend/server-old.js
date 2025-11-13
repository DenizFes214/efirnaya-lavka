import express from 'express';
import cors from 'cors';
import db from './db.js';
import multer from 'multer';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__dirname);

// Конфигурация Telegram бота
const
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(row);
  });
});

app.delete('/api/admin/products/:id', (req, res) => {TOKEN = process.env.BOT_TOKEN || '8340741653:AAGFC-nW1BnLobjhgXSKRjNY83HkU4pCqrw';
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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = join(process.cwd(), 'backend', 'uploads');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

app.use('/uploads', express.static(path.join(process.cwd(), 'backend', 'uploads')));

// Статические файлы для фронтенда
app.use(express.static(path.join(__dirname, 'frontend')));

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

app.post('/api/admin/categories', upload.single('image'), (req, res) => {
  try {
    const { name, description, position } = req.body;
    const image_url = req.file ? '/uploads/' + req.file.filename : '';
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    db.run(
      'INSERT INTO categories(name, slug, description, image_url, position) VALUES(?,?,?,?,?)',
      [name, slug, description || '', image_url, position || 0],
      function (err) {
        if (err) {
          console.error('Error inserting category:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
      }
    );
  } catch (error) {
    console.error('Error in category creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/categories/:id', upload.single('image'), (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, position } = req.body;
    let image_url = req.body.existing_image || '';
    
    if (req.file) {
      image_url = '/uploads/' + req.file.filename;
    }
    
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    db.run(
      'UPDATE categories SET name=?, slug=?, description=?, image_url=?, position=? WHERE id=?',
      [name, slug, description || '', image_url, position || 0, id],
      function (err) {
        if (err) {
          console.error('Error updating category:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ updated: this.changes });
      }
    );
  } catch (error) {
    console.error('Error in category update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/categories/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM categories WHERE id=?', [id], function (err) {
    if (err) {
      console.error('Error deleting category:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ deleted: this.changes });
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

app.post('/api/admin/products', upload.single('image'), (req, res) => {
  try {
    console.log('Files received:', req.file);
    console.log('Body received:', req.body);
    
    const { category_id, name, description, price, stock } = req.body;
    const image_url = req.file ? '/uploads/' + req.file.filename : '';
    
    if (!category_id || !name || !price) {
      return res.status(400).json({ error: 'Не заполнены обязательные поля' });
    }
    
    db.run(
      'INSERT INTO products(category_id, name, description, price, stock, image_url) VALUES(?,?,?,?,?,?)',
      [category_id, name, description, price, stock || '', image_url],
      function (err) {
        if (err) {
          console.error('Error inserting product:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
      }
    );
  } catch (error) {
    console.error('Error in product creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/products/:id', upload.single('image'), (req, res) => {
  try {
    const id = req.params.id;
    const { category_id, name, description, price, stock } = req.body;
    let image_url = req.body.existing_image || '';
    
    if (req.file) {
      image_url = '/uploads/' + req.file.filename;
    }
    
    db.run(
      'UPDATE products SET category_id=?, name=?, description=?, price=?, stock=?, image_url=? WHERE id=?',
      [category_id, name, description, price, stock || '', image_url, id],
      function (err) {
        if (err) {
          console.error('Error updating product:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ updated: this.changes });
      }
    );
  } catch (error) {
    console.error('Error in product update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/products/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM product_images WHERE product_id=?', [id]);
  db.run('DELETE FROM products WHERE id=?', [id], function (err) {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ deleted: this.changes });
  });
});

// === API: изображения товара ===
app.post('/api/admin/products/:id/images', upload.array('images', 10), (req, res) => {
  const id = req.params.id;
  const files = req.files || [];
  const urls = files.map((f) => '/uploads/' + f.filename);
  const stmt = db.prepare('INSERT INTO product_images(product_id, url) VALUES(?,?)');
  urls.forEach((u) => stmt.run(id, u));
  stmt.finalize();
  res.json({ urls });
});

app.get('/api/product/:id/images', (req, res) => {
  const id = req.params.id;
  db.all('SELECT url FROM product_images WHERE product_id=? ORDER BY position', [id], (e, rows) => {
    if (e) {
      console.error('Error fetching product images:', e);
      return res.status(500).json({ error: e.message });
    }
    res.json((rows || []).map((r) => r.url));
  });
});

// === API: отзывы ===
app.get('/api/product/:id/reviews', (req, res) => {
  const id = req.params.id;
  db.all('SELECT * FROM reviews WHERE product_id=? AND approved=1 ORDER BY created_at DESC', [id], (err, rows) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.post('/api/reviews', express.json(), (req, res) => {
  const { product_id, user_id, username, text, rating } = req.body;
  db.run(
    'INSERT INTO reviews(product_id, user_id, username, text, rating) VALUES(?,?,?,?,?)',
    [product_id, user_id, username, text, rating],
    function (err) {
      if (err) {
        console.error('Error inserting review:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/admin/reviews', (req, res) => {
  const productId = req.query.product_id;
  let sql = 'SELECT r.*, p.name as product_name FROM reviews r LEFT JOIN products p ON r.product_id = p.id WHERE r.approved=0';
  let args = [];
  if (productId) {
    sql += ' AND r.product_id=?';
    args.push(productId);
  }
  sql += ' ORDER BY r.created_at DESC';
  db.all(sql, args, (err, rows) => {
    if (err) {
      console.error('Error fetching reviews for moderation:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.post('/api/admin/reviews/:id/approve', express.json(), (req, res) => {
  const { admin_comment } = req.body;
  db.run('UPDATE reviews SET approved=1, admin_comment=? WHERE id=?', [admin_comment || '', req.params.id], function (err) {
    if (err) {
      console.error('Error approving review:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ approved: this.changes });
  });
});

app.delete('/api/admin/reviews/:id', (req, res) => {
  db.run('DELETE FROM reviews WHERE id=?', [req.params.id], function (err) {
    if (err) {
      console.error('Error deleting review:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ deleted: this.changes });
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

app.post('/api/cart', validateTelegramWebApp, express.json(), (req, res) => {
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
app.post('/api/orders', validateTelegramWebApp, express.json(), (req, res) => {
  try {
    console.log('Received order request:', req.body);
    
    const user = req.telegramUser;
    const { items = [], comment = '', delivery_method = 'pickup', delivery_address = '' } = req.body || {};
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    // Вычисляем общую стоимость
    const productIds = items.map(item => item.id);
    const placeholders = productIds.map(() => '?').join(',');
    
    db.all(`SELECT id, price FROM products WHERE id IN (${placeholders})`, productIds, (err, products) => {
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
            ...item,
            price: product.price,
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
            stmt.run([orderId, item.id, item.name || 'Товар', item.price, item.quantity]);
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
              const itemsList = validItems.map(i => `${i.name || 'Товар'} (x${i.quantity})`).join(', ');
              const message = `🛒 Новый заказ №${orderId}
              
👤 Заказчик: ${user.first_name} ${user.last_name || ''} (@${user.username || 'без username'})
📦 Товары: ${itemsList}
💰 Сумма: ${total}₽
📝 Комментарий: ${comment || 'нет'}
🚚 Доставка: ${delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}
${delivery_address ? `📍 Адрес: ${delivery_address}` : ''}`;

              // Используем функцию из bot.js для отправки уведомления
              sendChannelNotification(message, true); // отправляем в тестовый канал
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
        if (err) {
          console.error('Error creating order:', err);
          return res.status(500).json({ error: err.message });
        }
        
        const order_id = this.lastID;
        const st = db.prepare(
          'INSERT INTO order_items(order_id, product_id, name, price, qty) VALUES(?,?,?,?,?)'
        );
        
        items.forEach((it) => {
          st.run(order_id, it.id, it.name, it.price, it.qty || 1);
        });
        
        st.finalize((err) => {
          if (err) {
            console.error('Error saving order items:', err);
            return res.status(500).json({ error: err.message });
          }
          
          // Отправляем уведомление админам
          try {
            const items_list = items.map(i => `${i.name} (x${i.qty || 1})`).join(', ');
            notifyAdminsAboutOrder({
              id: order_id,
              username,
              items_list,
              total,
              delivery_method,
              delivery_address,
              delivery_point,
              comment
            });
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
            // Не прерываем выполнение из-за ошибки уведомления
          }
          
          res.json({ id: order_id });
        });
      }
    );
  } catch (error) {
    console.error('Unexpected error in order processing:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.get('/api/admin/orders', (req, res) => {
  const { start_date, end_date, status } = req.query;
  let sql = `SELECT o.*, 
            (SELECT GROUP_CONCAT(oi.name || ' (x' || oi.qty || ')', ', ') 
             FROM order_items oi WHERE oi.order_id = o.id) as items_list
            FROM orders o WHERE 1=1`;
  let args = [];
  
  if (start_date) {
    sql += ' AND date(o.created_at) >= date(?)';
    args.push(start_date);
  }
  if (end_date) {
    sql += ' AND date(o.created_at) <= date(?)';
    args.push(end_date);
  }
  if (status) {
    sql += ' AND o.status = ?';
    args.push(status);
  }
  
  sql += ' ORDER BY o.created_at DESC';
  
  db.all(sql, args, (err, rows) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// === API: акции ===
app.get('/api/promotions', (req, res) => {
  db.all('SELECT * FROM promotions WHERE active=1 ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching promotions:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.get('/api/admin/promotions', (req, res) => {
  db.all('SELECT * FROM promotions ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching all promotions:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.post('/api/admin/promotions', upload.single('image'), (req, res) => {
  try {
    const { title, content } = req.body;
    const image_url = req.file ? '/uploads/' + req.file.filename : '';
    
    db.run(
      'INSERT INTO promotions(title, content, image_url) VALUES(?,?,?)',
      [title, content, image_url],
      function (err) {
        if (err) {
          console.error('Error creating promotion:', err);
          return res.status(500).json({ error: err.message });
        }
        
        // Публикуем акцию в канале
        const promotion = { id: this.lastID, title, content, image_url };
        publishPromotion(promotion);
        
        res.json({ id: this.lastID });
      }
    );
  } catch (error) {
    console.error('Error in promotion creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/promotions/:id', upload.single('image'), (req, res) => {
  try {
    const id = req.params.id;
    const { title, content, active } = req.body;
    let image_url = req.body.existing_image || '';
    
    if (req.file) {
      image_url = '/uploads/' + req.file.filename;
    }
    
    db.run(
      'UPDATE promotions SET title=?, content=?, image_url=?, active=? WHERE id=?',
      [title, content, image_url, active || 1, id],
      function (err) {
        if (err) {
          console.error('Error updating promotion:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ updated: this.changes });
      }
    );
  } catch (error) {
    console.error('Error in promotion update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/promotions/:id', (req, res) => {
  db.run('DELETE FROM promotions WHERE id=?', [req.params.id], function (err) {
    if (err) {
      console.error('Error deleting promotion:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ deleted: this.changes });
  });
});

// === API: избранное ===
app.post('/api/favorites/toggle', express.json(), (req, res) => {
  const { telegram_id, product_id } = req.body || {};
  if (!telegram_id) return res.status(200).json({ localOnly: true });
  db.run(
    'INSERT OR IGNORE INTO favorites(user_telegram_id, product_id) VALUES(?,?)',
    [telegram_id, product_id],
    function (err) {
      if (err) {
        console.error('Error toggling favorite:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes > 0) return res.json({ favorited: true });
      db.run(
        'DELETE FROM favorites WHERE user_telegram_id=? AND product_id=?',
        [telegram_id, product_id],
        function (err2) {
          if (err2) {
            console.error('Error removing favorite:', err2);
            return res.status(500).json({ error: err2.message });
          }
          res.json({ favorited: false });
        }
      );
    }
  );
});

app.get('/api/favorites/:telegram_id', (req, res) => {
  db.all(
    'SELECT product_id FROM favorites WHERE user_telegram_id=?',
    [req.params.telegram_id],
    (e, rows) => {
      if (e) {
        console.error('Error fetching favorites:', e);
        return res.status(500).json({ error: e.message });
      }
      res.json(rows.map((r) => r.product_id));
    }
  );
});

// === Static frontend ===
app.use(express.static(join(__dirname, '../frontend')));
app.get('/', (_req, res) => {
  res.sendFile(join(__dirname, '../frontend/index.html'));
});

// === Start server ===
const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Server up on port ${PORT}`));

// --- Telegram Bot ---
const TG_TOKEN = process.env.BOT_TOKEN;
let bot = null;
if (TG_TOKEN) {
  bot = new TelegramBot(TG_TOKEN, { polling: true });

  // Обработка команды /start
  bot.onText(/\/start|\/shop/i, (msg) => {
    const chatId = msg.chat.id;
    const PUBLIC_URL = process.env.PUBLIC_URL;
    const BUTTON_NAME = '🌿Эфирная Лавка🌿';
    const webApp = { url: PUBLIC_URL };
    
    bot.sendMessage(chatId, 'Добро пожаловать в 🌿Эфирную Лавку🌿!', {
      reply_markup: {
        inline_keyboard: [[{ text: BUTTON_NAME, web_app: webApp }]]
      }
    }).catch(console.error);
  });

  // Функция отправки уведомления о заказе админам
  function notifyAdminsAboutOrder(order) {
    const adminIds = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim());
    let message = `🛍️ Новый заказ #${order.id}\n` +
      `От: ${order.username}\n` +
      `Товары: ${order.items_list}\n` +
      `Сумма: ${order.total} руб.\n` +
      `Способ доставки: ${order.delivery_method}\n`;
    
    if (order.delivery_address) {
      message += `Адрес: ${order.delivery_address}\n`;
    }
    if (order.delivery_point) {
      message += `Пункт выдачи: ${order.delivery_point}\n`;
    }
    if (order.comment) {
      message += `Комментарий: ${order.comment}\n`;
    }
    
    adminIds.forEach(adminId => {
      bot.sendMessage(adminId, message).catch(console.error);
    });
  }

  // Функция публикации акции в канале
  async function publishPromotion(promotion) {
    const chatId = process.env.PROMO_TARGET_CHAT_ID;
    if (!chatId) return;
    
    try {
      let message = `✨ АКЦИЯ! ✨ Только для подписчиков канала 💎\n\n` +
        `<b>${promotion.title}</b>\n\n` +
        `${promotion.content}`;
      
      let options = { parse_mode: 'HTML' };
      
      if (promotion.image_url) {
        const fullImageUrl = process.env.PUBLIC_URL + promotion.image_url;
        await bot.sendPhoto(chatId, fullImageUrl, { caption: message, ...options });
      } else {
        await bot.sendMessage(chatId, message, options);
      }
    } catch (error) {
      console.error('Ошибка публикации акции:', error);
    }
  }

  // Функция закрепления сообщения о магазине в канале
  async function pinShopMessage(chatId) {
    try {
      const message = await bot.sendMessage(chatId, '🌿 Добро пожаловать в Эфирную Лавку! 🌿', {
        reply_markup: {
          inline_keyboard: [[{
            text: 'Открыть магазин',
            web_app: { url: process.env.PUBLIC_URL }
          }]]
        }
      });
      
      await bot.pinChatMessage(chatId, message.message_id);
    } catch (error) {
      console.error('Ошибка при закреплении сообщения:', error);
    }
  }

  // Установка меню бота
  try {
    const PUBLIC_URL = process.env.PUBLIC_URL;
    const BUTTON_NAME = '🌿Эфирная Лавка🌿';
    
    bot.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: BUTTON_NAME,
        web_app: { url: PUBLIC_URL }
      }
    }).catch(() => {});
    
    // Закрепляем сообщение в целевом чате
    const targetChatId = process.env.PROMO_TARGET_CHAT_ID;
    if (targetChatId) {
      pinShopMessage(targetChatId);
    }
  } catch (error) {
    console.error('Ошибка настройки меню бота:', error);
  }
}