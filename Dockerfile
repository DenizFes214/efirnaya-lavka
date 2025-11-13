# Используем Node.js 18 с полной glibc для better-sqlite3
FROM node:18-bullseye-slim

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Создаем рабочую директорию
WORKDIR /app

# Копируем package файлы и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --omit=dev

# Копируем исходный код (node_modules исключены через .dockerignore)
COPY . .

# Создаем директорию для базы данных
RUN mkdir -p /app/backend

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=80

# Открываем порт
EXPOSE 80

# Запускаем приложение
CMD ["npm", "start"]