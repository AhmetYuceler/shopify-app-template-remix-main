# 🚀 Railway Deployment - Quick Start

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Railway Deployment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Git hazırlığı
Write-Host "📦 Step 1: Preparing Git repository..." -ForegroundColor Yellow
git add .
git commit -m "feat: Ready for Railway deployment with dynamic pricing system"
Write-Host "✅ Git commit created" -ForegroundColor Green
Write-Host ""

# 2. Railway CLI kontrol
Write-Host "🚂 Step 2: Checking Railway CLI..." -ForegroundColor Yellow
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayInstalled) {
    Write-Host "❌ Railway CLI not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Installing Railway CLI..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run:" -ForegroundColor Cyan
    Write-Host "  npm install -g @railway/cli" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use the web dashboard:" -ForegroundColor Cyan
    Write-Host "  https://railway.app" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Railway CLI is installed" -ForegroundColor Green
Write-Host ""

# 3. Railway login
Write-Host "🔐 Step 3: Logging into Railway..." -ForegroundColor Yellow
railway login
Write-Host ""

# 4. Yeni proje oluştur
Write-Host "🏗️  Step 4: Creating Railway project..." -ForegroundColor Yellow
railway init
Write-Host ""

# 5. Environment variables ekle
Write-Host "⚙️  Step 5: Setting environment variables..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Please add these variables in Railway Dashboard:" -ForegroundColor Cyan
Write-Host "  https://railway.app/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Variables needed:" -ForegroundColor Yellow
Write-Host "  SHOPIFY_API_KEY=$env:SHOPIFY_API_KEY" -ForegroundColor White
Write-Host "  SHOPIFY_API_SECRET=$env:SHOPIFY_API_SECRET" -ForegroundColor White
Write-Host "  SCOPES=write_products,read_products,read_themes,write_draft_orders,write_publications,read_publications" -ForegroundColor White
Write-Host "  DATABASE_URL=file:./dev.sqlite" -ForegroundColor White
Write-Host ""

# 6. Deploy
Write-Host "🚀 Step 6: Deploying to Railway..." -ForegroundColor Yellow
railway up
Write-Host ""

# 7. URL al
Write-Host "🔗 Step 7: Getting your app URL..." -ForegroundColor Yellow
railway domain
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy your Railway URL from above" -ForegroundColor White
Write-Host "2. Update shopify.app.toml with your Railway URL" -ForegroundColor White
Write-Host "3. Update Shopify Partner Dashboard" -ForegroundColor White
Write-Host "4. Run: shopify app deploy" -ForegroundColor White
Write-Host ""
