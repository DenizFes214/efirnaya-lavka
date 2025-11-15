#!/bin/bash
# 🌿 Скрипт автоматического деплоя в AMVERA

echo "🌿 Эфирная Лавка - Автоматический деплой в AMVERA"
echo "=================================================="

# Проверяем что мы в правильной директории
if [ ! -f "amvera.yml" ]; then
    echo "❌ Файл amvera.yml не найден. Запустите скрипт из корня проекта."
    exit 1
fi

# Проверяем git репозиторий
if [ ! -d ".git" ]; then
    echo "❌ Git репозиторий не инициализирован."
    exit 1
fi

echo "📝 Добавляем файлы в git..."
git add .

echo "💾 Создаем коммит..."
git commit -m "🚀 Deploy ready: Эфирная Лавка for AMVERA $(date '+%Y-%m-%d %H:%M:%S')"

echo ""
echo "🔗 Выберите платформу для создания репозитория:"
echo "1) GitHub (github.com)"
echo "2) GitLab (gitlab.com)" 
echo "3) Bitbucket (bitbucket.org)"
echo "4) Пропустить - уже есть репозиторий"
echo ""
read -p "Введите номер (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📋 GitHub Setup:"
        echo "1. Перейдите на https://github.com/new"
        echo "2. Создайте репозиторий 'efirnaya-lavka-amvera'"
        echo "3. НЕ инициализируйте README, .gitignore или лицензию"
        echo ""
        read -p "Введите ваш GitHub username: " username
        repo_url="https://github.com/$username/efirnaya-lavka-amvera.git"
        ;;
    2)
        echo ""
        echo "📋 GitLab Setup:"
        echo "1. Перейдите на https://gitlab.com/projects/new"
        echo "2. Создайте репозиторий 'efirnaya-lavka-amvera'"
        echo ""
        read -p "Введите ваш GitLab username: " username
        repo_url="https://gitlab.com/$username/efirnaya-lavka-amvera.git"
        ;;
    3)
        echo ""
        echo "📋 Bitbucket Setup:"
        echo "1. Перейдите на https://bitbucket.org/repo/create"
        echo "2. Создайте репозиторий 'efirnaya-lavka-amvera'"
        echo ""
        read -p "Введите ваш Bitbucket username: " username
        repo_url="https://bitbucket.org/$username/efirnaya-lavka-amvera.git"
        ;;
    4)
        read -p "Введите URL существующего репозитория: " repo_url
        ;;
    *)
        echo "❌ Неверный выбор"
        exit 1
        ;;
esac

if [ ! -z "$repo_url" ]; then
    echo ""
    echo "🔗 Подключаем удаленный репозиторий..."
    git remote remove origin 2>/dev/null || true
    git remote add origin "$repo_url"
    
    echo "🌿 Переименовываем ветку в main..."
    git branch -M main
    
    echo "🚀 Пушим в репозиторий..."
    if git push -u origin main; then
        echo ""
        echo "✅ Успешно! Репозиторий создан: $repo_url"
        echo ""
        echo "📋 Следующие шаги для AMVERA:"
        echo "1. Перейдите на https://amvera.io/"
        echo "2. Создайте новое приложение"
        echo "3. Выберите 'Из Git репозитория'"
        echo "4. Вставьте URL: $repo_url"
        echo "5. Выберите ветку: main"
        echo "6. Установите переменные окружения из DEPLOYMENT-AMVERA.md"
        echo ""
        echo "🌟 Готово к деплою в AMVERA!"
    else
        echo ""
        echo "❌ Ошибка при push. Проверьте:"
        echo "- Создан ли репозиторий на платформе?"
        echo "- Правильный ли URL репозитория?"
        echo "- Есть ли права доступа?"
    fi
fi

echo ""
echo "📖 Подробная документация в файле DEPLOYMENT-AMVERA.md"