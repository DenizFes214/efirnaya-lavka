# 🌿 Telegram MiniApp Setup - Эфирная Лавка

## 📋 Общая информация

**Эфирная Лавка** - это Telegram MiniApp для продажи эфирных масел, трав и магических товаров.

### 🔗 Основные ссылки:
- **Живой сайт**: https://efirnayalavka-aleksei57.amvera.io
- **GitHub**: https://github.com/DenizFes214/efirnaya-lavka
- **AMVERA**: Проект `efirnayalavka` (aleksei57)

---

## 🛠 Технический стек

### Backend:
- **Node.js 18+** с Express
- **SQLite** (better-sqlite3) для базы данных
- **Telegram Bot API** (node-telegram-bot-api)
- **Multer** для загрузки файлов

### Frontend:
- **Vanilla JavaScript** (ES6 modules)
- **Telegram Apps SDK 2.x** (@telegram-apps/sdk)
- **CSS3** с магической темой

### Деплоймент:
- **Docker** контейнеризация
- **AMVERA** облачная платформа
- **GitHub** для версионирования

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/DenizFes214/efirnaya-lavka.git
cd efirnaya-lavka
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Запуск локально
```bash
# Разработка
npm run dev

# Продакшн
npm start
```

### 4. Docker запуск
```bash
# Сборка
docker build -t efirnaya-lavka .

# Запуск
docker run -p 80:80 efirnaya-lavka
```

---

## 📦 Telegram Apps SDK 2.x Integration

### Установка
```bash
npm install @telegram-apps/sdk@^2.2.0
npm install @telegram-apps/init-data-node@^1.0.3
```

### Frontend инициализация (frontend/static/js/tma-init.js)
```javascript
import { 
  initializeApp, 
  miniApp, 
  initData, 
  viewport,
  mainButton,
  backButton,
  themeParams
} from '@telegram-apps/sdk';

// Инициализация SDK
const [miniAppMounted] = initializeApp();

// Настройка viewport
if (viewport.mount.isAvailable()) {
  viewport.mount();
  viewport.expand();
}

// Настройка темы
if (themeParams.mount.isAvailable()) {
  themeParams.mount();
}

// Основная кнопка
if (mainButton.mount.isAvailable()) {
  mainButton.mount();
}

// Инициализация данных
if (initData.restore.isAvailable()) {
  initData.restore();
}
```

### Backend валидация (backend/server.js)
```javascript
import { validate } from '@telegram-apps/init-data-node';

const validateTelegramWebApp = (req, res, next) => {
  const initDataRaw = req.headers['x-telegram-init-data'];
  
  if (!initDataRaw) {
    return res.status(401).json({ error: 'Missing Telegram init data' });
  }

  try {
    // Валидация с помощью нового SDK
    const initData = validate(initDataRaw, process.env.BOT_TOKEN);
    req.telegramUser = initData.user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid Telegram data' });
  }
};
```

---

## 🤖 Настройка Telegram бота

### 1. Создание бота через @BotFather
```
/newbot
Название: 🌿 Эфирная Лавка
Username: efirnaya_lavka_bot
```

### 2. Настройка WebApp
```
/setmenubutton
@efirnaya_lavka_bot
text: 🛒 Открыть магазин
url: https://efirnayalavka-aleksei57.amvera.io
```

### 3. Настройка команд
```
/setcommands
@efirnaya_lavka_bot

start - 🌟 Начать работу с магазином
catalog - 📋 Каталог товаров  
cart - 🛒 Корзина
orders - 📦 Мои заказы
help - ❓ Помощь
```

### 4. Настройка домена
```
/setdomain
@efirnaya_lavka_bot
https://efirnayalavka-aleksei57.amvera.io
```

---

## 🔐 Переменные окружения

### Обязательные:
```bash
BOT_TOKEN=8340741653:AAGFC-nW1BnLobjhgXSKRjNY83HkU4pCqrw
ADMIN_IDS=985246360,1562870920
MAIN_CHANNEL_ID=-1002261187486
TEST_CHANNEL_ID=-1002277761715
```

### Опциональные:
```bash
NODE_ENV=production
PORT=80
PUBLIC_URL=https://efirnayalavka-aleksei57.amvera.io
DB_PATH=/data/efirnaya-lavka.sqlite
UPLOADS_PATH=/data/uploads
```

---

## 📁 Структура проекта

```
efirnaya-lavka/
├── 📂 backend/
│   ├── server.js          # Основной Express сервер
│   ├── db.js              # SQLite база данных
│   └── telegram-miniapp.js # Telegram API интеграция
├── 📂 frontend/
│   ├── index.html         # Главная страница
│   ├── admin.html         # Админ панель
│   └── 📂 static/
│       ├── 📂 css/
│       │   └── tma-styles.css
│       ├── 📂 js/
│       │   └── tma-init.js
│       ├── 📂 icons/
│       └── 📂 products/
├── 📂 nginx/
│   └── nginx.conf         # Nginx конфигурация
├── Dockerfile             # Docker образ
├── docker-compose.yml     # Docker Compose
├── amvera.yml            # AMVERA конфигурация  
└── package.json          # Зависимости Node.js
```

---

## 🎨 Особенности дизайна

### Магическая тема:
- 🎨 **Цветовая схема**: Коричневый, зеленый, золотой
- 🔮 **Шрифты**: Cinzel (заголовки), Cormorant Garamond (текст)  
- ✨ **Эффекты**: Градиенты, тени, анимации
- 🌿 **Иконки**: Ведьминская тематика

### Адаптивность:
- 📱 **Mobile-first** подход
- 🔄 **Telegram WebApp** стандарты
- 🌓 **Dark/Light** режимы

---

## 🚀 Деплоймент на AMVERA

### 1. Создание проекта
- Название: `efirnayalavka`
- Тип: Docker Runtime
- Git: Подключение к GitHub

### 2. Настройка домена
- Тип: HTTPS  
- Домен: `efirnayalavka-aleksei57.amvera.io`

### 3. Переменные окружения
Добавить в настройках проекта все переменные из раздела выше.

### 4. Деплоймент
```bash
git push origin main  # GitHub
git push amvera main  # AMVERA
```

---

## 🛡 Безопасность

### Аутентификация:
- ✅ Валидация Telegram InitData
- ✅ HMAC подпись проверка
- ✅ Админские права (ID: 985246360, 1562870920)

### База данных:
- ✅ SQLite в `/data/` (постоянное хранилище)
- ✅ Prepared statements (SQL injection защита)
- ✅ Автоматические бэкапы AMVERA

---

## 📊 API Endpoints

### Публичные:
- `GET /api/health` - Проверка здоровья
- `GET /api/categories` - Список категорий  
- `GET /api/categories/:id/products` - Товары категории
- `POST /api/auth/telegram` - Авторизация

### Админские:
- `POST /api/admin/categories` - Создание категории
- `POST /api/admin/products` - Создание товара
- `POST /api/admin/upload` - Загрузка файлов

---

## 🔧 Разработка

### Локальный запуск:
```bash
# Установка зависимостей  
npm install

# Запуск сервера разработки
npm run dev

# Доступ: http://localhost:3000
```

### Тестирование в Telegram:
1. Создать тестового бота
2. Настроить ngrok туннель  
3. Обновить URL в боте

### Docker разработка:
```bash
# Сборка образа
docker build -t efirnaya-lavka .

# Запуск с volumes
docker run -v $(pwd):/app -p 80:80 efirnaya-lavka
```

---

## 📞 Поддержка

### Контакты:
- **Telegram**: @your_support_bot
- **Email**: support@efirnayalavka.com  
- **GitHub Issues**: https://github.com/DenizFes214/efirnaya-lavka/issues

### Логи и отладка:
- **AMVERA**: Вкладка "Логи" в панели проекта
- **Локально**: `console.log` в браузере DevTools
- **Backend**: `console.log` в терминале/Docker логах

---

## 🔄 Обновления

### Регулярные задачи:
- 📦 Обновление зависимостей: `npm update`
- 🔒 Проверка безопасности: `npm audit`  
- 🏷️ Создание релизов через GitHub
- 💾 Мониторинг базы данных

### Roadmap:
- 💳 **Интеграция платежей** (YooKassa)
- 📱 **Push уведомления**
- 🌍 **Мультиязычность**  
- 📈 **Аналитика продаж**

---

**✨ Эфирная Лавка - магическое место для души и тела! ✨**