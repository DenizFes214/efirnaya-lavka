# Используем Node.js 18 с полной glibc для better-sqlite3
FROM node:18-bullseye-slim

# Устанавливаем системные зависимости для компиляции native модулей
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Создаем рабочую директорию
WORKDIR /app

# Копируем package файлы первыми для кэширования
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --omit=dev && npm cache clean --force

# Копируем весь проект (исключения в .dockerignore)
COPY . .

# Создаем необходимые директории
RUN mkdir -p /data /data/uploads

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=80
ENV DB_PATH=/data/efirnaya-lavka.sqlite
ENV UPLOADS_PATH=/data/uploads

# Открываем порт 80
EXPOSE 80

# Проверка здоровья приложения
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/api/health || exit 1

# Запускаем приложение напрямую
CMD ["node", "backend/server.js"]