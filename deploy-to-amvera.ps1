# 🌿 PowerShell скрипт для деплоя в AMVERA
# Запуск: .\deploy-to-amvera.ps1

Write-Host "🌿 Эфирная Лавка - Автоматический деплой в AMVERA" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Проверяем что мы в правильной директории
if (-not (Test-Path "amvera.yml")) {
    Write-Host "❌ Файл amvera.yml не найден. Запустите скрипт из корня проекта." -ForegroundColor Red
    exit 1
}

# Проверяем git репозиторий
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git репозиторий не инициализирован." -ForegroundColor Red
    exit 1
}

Write-Host "📝 Добавляем файлы в git..." -ForegroundColor Yellow
git add .

$commitMessage = "🚀 Deploy ready: Эфирная Лавка for AMVERA $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "💾 Создаем коммит..." -ForegroundColor Yellow
git commit -m $commitMessage

Write-Host ""
Write-Host "🔗 Выберите платформу для создания репозитория:" -ForegroundColor Cyan
Write-Host "1) GitHub (github.com)" -ForegroundColor White
Write-Host "2) GitLab (gitlab.com)" -ForegroundColor White
Write-Host "3) Bitbucket (bitbucket.org)" -ForegroundColor White
Write-Host "4) Пропустить - уже есть репозиторий" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Введите номер (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📋 GitHub Setup:" -ForegroundColor Cyan
        Write-Host "1. Перейдите на https://github.com/new" -ForegroundColor White
        Write-Host "2. Создайте репозиторий 'efirnaya-lavka-amvera'" -ForegroundColor White
        Write-Host "3. НЕ инициализируйте README, .gitignore или лицензию" -ForegroundColor White
        Write-Host ""
        $username = Read-Host "Введите ваш GitHub username"
        $repoUrl = "https://github.com/$username/efirnaya-lavka-amvera.git"
    }
    "2" {
        Write-Host ""
        Write-Host "📋 GitLab Setup:" -ForegroundColor Cyan
        Write-Host "1. Перейдите на https://gitlab.com/projects/new" -ForegroundColor White
        Write-Host "2. Создайте репозиторий 'efirnaya-lavka-amvera'" -ForegroundColor White
        Write-Host ""
        $username = Read-Host "Введите ваш GitLab username"
        $repoUrl = "https://gitlab.com/$username/efirnaya-lavka-amvera.git"
    }
    "3" {
        Write-Host ""
        Write-Host "📋 Bitbucket Setup:" -ForegroundColor Cyan
        Write-Host "1. Перейдите на https://bitbucket.org/repo/create" -ForegroundColor White
        Write-Host "2. Создайте репозиторий 'efirnaya-lavka-amvera'" -ForegroundColor White
        Write-Host ""
        $username = Read-Host "Введите ваш Bitbucket username"
        $repoUrl = "https://bitbucket.org/$username/efirnaya-lavka-amvera.git"
    }
    "4" {
        $repoUrl = Read-Host "Введите URL существующего репозитория"
    }
    default {
        Write-Host "❌ Неверный выбор" -ForegroundColor Red
        exit 1
    }
}

if ($repoUrl) {
    Write-Host ""
    Write-Host "🔗 Подключаем удаленный репозиторий..." -ForegroundColor Yellow
    git remote remove origin 2>$null
    git remote add origin $repoUrl
    
    Write-Host "🌿 Переименовываем ветку в main..." -ForegroundColor Yellow
    git branch -M main
    
    Write-Host "🚀 Пушим в репозиторий..." -ForegroundColor Yellow
    $pushResult = git push -u origin main 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Успешно! Репозиторий создан: $repoUrl" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Следующие шаги для AMVERA:" -ForegroundColor Cyan
        Write-Host "1. Перейдите на https://amvera.io/" -ForegroundColor White
        Write-Host "2. Создайте новое приложение" -ForegroundColor White
        Write-Host "3. Выберите 'Из Git репозитория'" -ForegroundColor White
        Write-Host "4. Вставьте URL: $repoUrl" -ForegroundColor White
        Write-Host "5. Выберите ветку: main" -ForegroundColor White
        Write-Host "6. Установите переменные окружения из DEPLOYMENT-AMVERA.md" -ForegroundColor White
        Write-Host ""
        Write-Host "🌟 Готово к деплою в AMVERA!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Ошибка при push. Проверьте:" -ForegroundColor Red
        Write-Host "- Создан ли репозиторий на платформе?" -ForegroundColor White
        Write-Host "- Правильный ли URL репозитория?" -ForegroundColor White
        Write-Host "- Есть ли права доступа?" -ForegroundColor White
        Write-Host ""
        Write-Host "Ошибка: $pushResult" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📖 Подробная документация в файле DEPLOYMENT-AMVERA.md" -ForegroundColor Cyan