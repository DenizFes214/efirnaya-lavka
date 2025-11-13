import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Создаем или открываем базу данных в постоянном хранилище AMVERA
const dbPath = process.env.DB_PATH || '/data/efirnaya-lavka.sqlite';

// Создаем директорию /data если она не существует
try {
  mkdirSync('/data', { recursive: true });
} catch (error) {
  console.log('Директория /data уже существует или создана');
}

const db = new Database(dbPath);

// Включаем WAL режим для лучшей производительности
db.pragma('journal_mode = WAL');

// Создание всех необходимых таблиц
const createTables = () => {
  // Категории
  db.exec(`CREATE TABLE IF NOT EXISTS categories(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT UNIQUE,
    slug TEXT,
    description TEXT,
    image_url TEXT,
    position INTEGER DEFAULT 0
  )`);

  // Товары
  db.exec(`CREATE TABLE IF NOT EXISTS products(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    category_id INTEGER, 
    name TEXT, 
    price REAL, 
    description TEXT, 
    stock TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Изображения товаров
  db.exec(`CREATE TABLE IF NOT EXISTS product_images(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    url TEXT,
    position INTEGER
  )`);

  // Отзывы
  db.exec(`CREATE TABLE IF NOT EXISTS reviews(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    user_id INTEGER,
    username TEXT,
    text TEXT,
    rating INTEGER,
    approved INTEGER DEFAULT 0,
    admin_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Заказы
  db.exec(`CREATE TABLE IF NOT EXISTS orders(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    total REAL,
    comment TEXT,
    delivery_method TEXT,
    delivery_address TEXT,
    delivery_point TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Позиции заказов
  db.exec(`CREATE TABLE IF NOT EXISTS order_items(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    name TEXT,
    price REAL,
    qty INTEGER
  )`);

  // Избранное
  db.exec(`CREATE TABLE IF NOT EXISTS favorites(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_telegram_id INTEGER,
    product_id INTEGER,
    UNIQUE(user_telegram_id, product_id)
  )`);

  // Акции
  db.exec(`CREATE TABLE IF NOT EXISTS promotions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    image_url TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Группы
  db.exec(`CREATE TABLE IF NOT EXISTS groups(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER,
    title TEXT,
    type TEXT
  )`);

  // Пользователи Telegram
  db.exec(`CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Сессии корзины
  db.exec(`CREATE TABLE IF NOT EXISTS cart_items(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_telegram_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id),
    UNIQUE(user_telegram_id, product_id)
  )`);

  // Магические категории и свойства товаров
  db.exec(`CREATE TABLE IF NOT EXISTS product_properties(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    property_name TEXT,
    property_value TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  // Журнал административных действий
  db.exec(`CREATE TABLE IF NOT EXISTS admin_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_telegram_id INTEGER,
    action TEXT,
    target_type TEXT,
    target_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
};

// Заполнение начальными данными
const seedData = () => {
  // Подготовленные запросы для вставки категорий
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories(id, name, slug, description, image_url, position) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products(id, category_id, name, description, price, stock, image_url) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users(telegram_id, username, first_name, is_admin) 
    VALUES (?, ?, ?, ?)
  `);

  // Основные магические категории товаров
  const categories = [
    [1, '🌿 Эфирные масла', 'efirnye-masla', 'Чистые эфирные масла для ароматерапии и магических практик', '/static/products/oil-mint.jpg', 1],
    [2, '🌱 Травы и сборы', 'travy-sbory', 'Сушеные травы, корни и магические сборы для ритуалов', '/static/products/hydrolat-lavender.jpg', 2],
    [3, '🕯️ Ритуальные предметы', 'ritualnye-predmety', 'Свечи, амулеты, кристаллы и магические инструменты', '/static/icons/witch_broom.png', 3],
    [4, '📚 Книги и руководства', 'knigi-rukovodstva', 'Книги по магии, травничеству и эзотерике', '', 4],
    [5, '✨ Услуги', 'uslugi', 'Ритуалы, консультации и мастер-классы', '', 5],
    [6, '🧴 Натуральная косметика', 'naturalnaya-kosmetika', 'Крема, шампуни и косметика на основе трав', '/static/products/cream-rose.jpg', 6]
  ];

  // Администраторы
  const admins = [
    [985246360, 'DaryaDub_07', 'Дарья', 1],
    [1562870920, 'Dan_vark', 'Алексей', 1]
  ];

  // Примеры товаров
  const products = [
    // Эфирные масла
    [1001, 1, 'Эфирное масло мяты', 'Освежающее масло мяты перечной для концентрации и ясности ума', 450, '15', '/static/products/oil-mint.jpg'],
    [1002, 1, 'Эфирное масло лаванды', 'Успокаивающее масло лаванды для релаксации и защиты', 520, '12', ''],
    [1003, 1, 'Эфирное масло кедра', 'Заземляющее масло кедра для силы и стабильности', 680, '8', ''],
    
    // Натуральная косметика  
    [2001, 6, 'Крем с розой', 'Питательный крем для лица с экстрактом розы и магическими травами', 850, '20', '/static/products/cream-rose.jpg'],
    [2002, 6, 'Гидролат лаванды', 'Натуральный гидролат лаванды для ухода за кожей', 380, '25', '/static/products/hydrolat-lavender.jpg'],
    [2003, 6, 'Твердый шампунь с кедром', 'Натуральный твердый шампунь с эфирным маслом кедра', 420, '18', '/static/products/shampoo-cedar.jpg'],
    
    // Услуги
    [5001, 5, 'Персональная консультация по ароматерапии', 'Индивидуальный подбор эфирных масел и составление магических смесей', 2500, 'по записи', ''],
    [5002, 5, 'Мастер-класс по травничеству', 'Обучение сбору, сушке и использованию магических трав', 3500, 'по записи', ''],
    [5003, 5, 'Ритуал очищения пространства', 'Энергетическое очищение дома или офиса травами и маслами', 4000, 'по записи', '']
  ];

  // Выполняем вставки в транзакции для скорости
  const transaction = db.transaction(() => {
    categories.forEach(category => insertCategory.run(...category));
    admins.forEach(admin => insertUser.run(...admin));
    products.forEach(product => insertProduct.run(...product));
  });

  transaction();
};

// Инициализация базы данных
try {
  createTables();
  seedData();
  console.log('🔮 База данных Эфирной Лавки инициализирована');
} catch (error) {
  console.error('Ошибка инициализации БД:', error);
}

// Адаптер для совместимости с старым API
const dbAdapter = {
  // Метод run для совместимости
  run(sql, params = [], callback) {
    try {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      const stmt = db.prepare(sql);
      const result = stmt.run(params);
      
      if (callback) {
        // Имитируем интерфейс sqlite3
        const context = {
          lastID: result.lastInsertRowid,
          changes: result.changes
        };
        callback.call(context, null);
      }
      
      return result;
    } catch (error) {
      if (callback) {
        callback(error);
      } else {
        throw error;
      }
    }
  },

  // Метод get для совместимости
  get(sql, params = [], callback) {
    try {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      const stmt = db.prepare(sql);
      const result = stmt.get(params);
      
      if (callback) {
        callback(null, result);
      }
      
      return result;
    } catch (error) {
      if (callback) {
        callback(error);
      } else {
        throw error;
      }
    }
  },

  // Метод all для совместимости
  all(sql, params = [], callback) {
    try {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      const stmt = db.prepare(sql);
      const result = stmt.all(params);
      
      if (callback) {
        callback(null, result);
      }
      
      return result;
    } catch (error) {
      if (callback) {
        callback(error);
      } else {
        throw error;
      }
    }
  },

  // Метод prepare
  prepare(sql) {
    return db.prepare(sql);
  }
};

export default dbAdapter;