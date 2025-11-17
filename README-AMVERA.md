# 🌿 Эфирная Лавка - Telegram MiniApp для AMVERA

**🚀 Готов к развертыванию на AMVERA Cloud Platform**

Добро пожаловать в магию ароматов и трав! ✨

## 🎯 О проекте

**Эфирная Лавка** — полнофункциональный Telegram MiniApp для продажи эфирных масел, трав и магических товаров с мистической атмосферой и полным циклом e-commerce.

### 🌟 Особенности

- **🔮 Мистический дизайн** с магической цветовой схемой
- **🛒 Полный интернет-магазин** с корзиной и заказами  
- **👑 Админ-панель** для управления товарами
- **📱 Telegram WebApp** полная интеграция
- **☁️ AMVERA готовность** с правильной архитектурой
- **🐳 Docker оптимизация** для облачного развертывания

## 🚀 Быстрое развертывание на AMVERA

### Вариант 1: Автоматический (рекомендуется)

```bash
# Запустите PowerShell скрипт
.\deploy-to-amvera.ps1

# Или bash скрипт (Linux/macOS)  
./deploy-to-amvera.sh
```

### Вариант 2: Ручной

1. **Создайте GitHub репозиторий:**
   - https://github.com/new
   - Имя: `efirnaya-lavka-amvera` 
   - НЕ добавляйте README/gitignore

2. **Загрузите код:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/efirnaya-lavka-amvera.git
   git push -u origin main
   ```

3. **Подключите к AMVERA:**
   - https://amvera.io/ → Создать приложение
   - "Из Git репозитория"
   - Вставьте URL репозитория
   - Выберите ветку `main`

> 📖 **Подробные инструкции:** [QUICK-DEPLOY.md](QUICK-DEPLOY.md)

## 🏗️ Архитектура AMVERA

### Code (Repository)
```
📦 Project Structure/
├── 📁 backend/           # Node.js + Express API
├── 📁 frontend/          # Telegram WebApp UI  
├── 📁 nginx/            # Reverse proxy config
├── 📄 amvera.yml        # AMVERA configuration ⭐
├── 📄 Dockerfile       # Optimized Docker build
├── 📄 package.json     # Dependencies
└── 📄 .gitignore/.dockerignore
```

### Data (Persistent `/data`)
```
📁 /data/                # AMVERA persistent storage
├── 📄 efirnaya-lavka.sqlite    # SQLite database
├── 📄 *.sqlite-wal            # Write-ahead log
└── 📁 uploads/                # User uploaded files
```

## ⚙️ Техническая конфигурация

### AMVERA Configuration (`amvera.yml`)
```yaml
runtime: docker
run:
  persistenceMount: /data
healthcheck:
  http:
    path: /api/health
    port: 80
env:
  - name: NODE_ENV
    value: production
  - name: DB_PATH
    value: "/data/efirnaya-lavka.sqlite"
  - name: UPLOADS_PATH  
    value: "/data/uploads"
```

### Environment Variables (Set in AMVERA panel)
```env
BOT_TOKEN=8340741653:AAGFC-nW1BnLobjhgXSKRjNY83HkU4pCqrw
ADMIN_IDS=985246360,1562870920
MAIN_CHANNEL_ID=-1002261187486
TEST_CHANNEL_ID=-1002277761715
PUBLIC_URL=https://efirnayalavka-aleksei57.amvera.io
```

### Docker Optimizations
- **Base:** `node:18-bullseye-slim` for compatibility
- **Native modules:** Proper compilation for better-sqlite3
- **Multi-stage build** for optimized image size
- **Health checks** for AMVERA monitoring

## 📱 API Reference

### Public Endpoints
```
GET  /api/health          # AMVERA health check
GET  /api/categories      # Product categories
GET  /api/products        # Product catalog  
POST /api/cart/add        # Add to cart
POST /api/orders          # Create order
```

### Admin Endpoints (Restricted)
```
GET    /api/admin/check         # Verify admin access
POST   /api/admin/products      # Create product
PUT    /api/admin/products/:id  # Update product
DELETE /api/admin/products/:id  # Delete product
POST   /api/admin/upload        # Upload images
```

## 🔒 Security & Compliance

### AMVERA Compliance ✅
- ✅ **Proper Code/Data separation** according to AMVERA docs
- ✅ **Absolute paths** `/data/` for persistent storage
- ✅ **User data exclusion** from git repository  
- ✅ **Correct `amvera.yml`** configuration format

### Security Features
- **Telegram WebApp** cryptographic validation
- **Admin whitelist** access control by user ID
- **SQL injection protection** via prepared statements
- **File upload restrictions** by type and size
- **CORS** properly configured for Telegram

## 📊 Performance

- **Database:** SQLite WAL mode for concurrent access
- **Static serving:** Nginx with proper caching
- **Image optimization:** Compressed for fast Docker builds
- **Health monitoring:** Built-in endpoint for AMVERA

## 🧪 Local Development

```bash
# Clone and setup
git clone YOUR_REPO_URL
cd efirnaya-lavka-amvera
npm install

# Configure environment  
cp .env.example .env
# Edit .env with your values

# Run with Docker
docker-compose up --build

# Test endpoints
curl http://localhost/api/health
curl http://localhost/api/categories
```

## 📚 Complete Documentation

- 🚀 [Quick Deploy Guide](QUICK-DEPLOY.md) - Step-by-step deployment
- 📋 [Detailed AMVERA Instructions](DEPLOYMENT-AMVERA.md)  
- ✅ [AMVERA Compliance Report](AMVERA-COMPLIANCE.md)
- 🔧 [Installation Guide](INSTALL.md)
- 📱 [Telegram Bot Setup](TELEGRAM_MINIAPP_SETUP.md)

## 🎨 Design System

### Magical Color Palette
```css
--magical-primary: #8B4513     /* Rich Brown */
--magical-secondary: #2F4F2F   /* Dark Green */  
--magical-accent: #DAA520      /* Golden */
--magical-dark: #1a1a1a       /* Dark Background */
--magical-light: #f5f5dc       /* Beige */
```

### Typography Stack
- **Headers:** Cinzel (magical serif)
- **Body:** Cormorant Garamond (elegant)
- **UI:** System font stack for performance

## 🌍 Production URLs

After deployment your app will be available at:
- **Main App:** `https://efirnayalavka-aleksei57.amvera.io`
- **Health Check:** `https://efirnayalavka-aleksei57.amvera.io/api/health`
- **Admin Panel:** `https://efirnayalavka-aleksei57.amvera.io/admin.html`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`  
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Credits

- **AMVERA** for cloud platform
- **Telegram** for WebApp API  
- **SQLite** for reliable database
- **Node.js** community
- **Docker** for containerization

---

**🌟 Made with magic for AMVERA cloud deployment** ✨

*Ready for production! Deploy and start selling magical products!* 🚀