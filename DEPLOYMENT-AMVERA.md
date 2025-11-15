# 🌿 Эфирная Лавка - AMVERA Deployment Guide

## 🚀 Быстрый старт с AMVERA

### 1. Создание удаленного репозитория

**Вариант A: GitHub (рекомендуется)**
```bash
# Создайте репозиторий на GitHub: https://github.com/new
# Имя: efirnaya-lavka-amvera

# Подключите удаленный репозиторий
git remote add origin https://github.com/YOUR_USERNAME/efirnaya-lavka-amvera.git
git branch -M main
git push -u origin main
```

**Вариант B: GitLab**
```bash
# Создайте репозиторий на GitLab: https://gitlab.com/projects/new
# Имя: efirnaya-lavka-amvera

git remote add origin https://gitlab.com/YOUR_USERNAME/efirnaya-lavka-amvera.git
git branch -M main  
git push -u origin main
```

**Вариант C: Bitbucket**
```bash
# Создайте репозиторий на Bitbucket: https://bitbucket.org/repo/create
# Имя: efirnaya-lavka-amvera

git remote add origin https://bitbucket.org/YOUR_USERNAME/efirnaya-lavka-amvera.git
git branch -M main
git push -u origin main
```

### 2. Подключение к AMVERA

1. **Зайдите в панель AMVERA:** https://amvera.io/
2. **Создайте новое приложение:**
   - Выберите "Создать приложение"
   - Выберите "Из Git репозитория"
   - Вставьте URL вашего репозитория
   - Выберите ветку `main`

3. **Конфигурация автоматически определится из `amvera.yml`**

### 3. Переменные окружения в AMVERA

**Обязательные переменные (установите в панели AMVERA):**

```env
NODE_ENV=production
PORT=80
BOT_TOKEN=8340741653:AAGFC-nW1BnLobjhgXSKRjNY83HkU4pCqrw
ADMIN_IDS=985246360,1562870920
MAIN_CHANNEL_ID=-1002261187486
TEST_CHANNEL_ID=-1002277761715
DB_PATH=/data/efirnaya-lavka.sqlite
UPLOADS_PATH=/data/uploads
PUBLIC_URL=https://YOUR_APP_NAME.amvera.io
```

**⚠️ Замените YOUR_APP_NAME на фактическое имя вашего приложения в AMVERA**

### 4. Deployment конфигурация

Приложение настроено для AMVERA со следующими особенностями:

✅ **Runtime:** Docker  
✅ **Healthcheck:** `/api/health` на порту 80  
✅ **Persistent Storage:** `/data` для SQLite и uploads  
✅ **Architecture:** Code/Data разделение согласно AMVERA docs

### 5. После деплоя

1. **Проверьте health:** `https://YOUR_APP_NAME.amvera.io/api/health`
2. **Откройте приложение:** `https://YOUR_APP_NAME.amvera.io`
3. **Настройте Telegram bot webhook** (если нужно)

### 📁 Структура проекта для AMVERA

```
📦 efirnaya-lavka-amvera/
├── 📁 backend/           # Node.js сервер
├── 📁 frontend/          # Telegram WebApp UI  
├── 📁 nginx/            # Nginx конфигурация
├── 📄 amvera.yml        # AMVERA конфигурация
├── 📄 Dockerfile       # Docker сборка
├── 📄 package.json     # Node.js зависимости
├── 📄 .gitignore       # Git исключения
└── 📄 .dockerignore    # Docker исключения
```

### 🔧 Локальная разработка

```bash
# Клонирование проекта
git clone YOUR_REPO_URL
cd efirnaya-lavka-amvera

# Установка зависимостей
npm install

# Создание .env файла
cp .env.example .env
# Отредактируйте .env с вашими данными

# Запуск через Docker
docker-compose up --build
```

### 📞 Поддержка

- **Документация AMVERA:** https://docs.amvera.io/
- **Telegram WebApp API:** https://core.telegram.org/bots/webapps
- **Проблемы с деплоем:** Проверьте логи в панели AMVERA

---

**🌟 Готов к магии! Ваша Эфирная Лавка скоро будет доступна в облаке AMVERA** ✨