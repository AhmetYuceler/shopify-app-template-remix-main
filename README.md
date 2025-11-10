# 🎯 Gifler ile projenin özeti

https://i.hizliresim.com/jmvu103.gif

# 🎯 Dinamik Fiyat Hesaplama Uygulaması

Shopify mağazalarında ürün boyutlarına (Boy × En) ve materyale göre dinamik fiyat hesaplayan, geçici ürün oluşturan ve otomatik temizleyen kapsamlı bir uygulama.

---

## 🌟 Özellikler

### ✨ Temel Özellikler
- **Dinamik Fiyat Hesaplama**: Boy × En × Katsayı + Materyal fiyatı formülü
- **3 Materyal Seçeneği**: Ahşap (50 $), Metal (100 $), Plastik (30 $)
- **Gerçek Zamanlı Fiyat Gösterimi**: Kullanıcı input değiştirince anında güncellenir
- **Geçici Ürün Oluşturma**: Her sipariş için benzersiz Shopify ürünü (katalog listelerinde gizli, doğrudan URL ile erişilebilir)
- **Otomatik Temizlik**: 2 saat sonra geçici ürünler otomatik silinir
- **Tema Entegrasyonu**: Herhangi bir Shopify temasına blok olarak eklenebilir
- **Responsive Tasarım**: Mobil ve masaüstünde mükemmel çalışır

### 📐 Fiyatlama Kuralları
| Alan (mm²) | Katsayı |
|------------|---------|
| 0 - 100,000 | 1.0 |
| 100,000 - 200,000 | 1.2 |
| 200,000 - 300,000 | 1.5 |
| 300,000+ | 2.0 |

**Formül:** `(Boy × En × Katsayı / 10000) + Materyal Fiyatı`

---

## 📁 Proje Yapısı

```
shopify-app-template-remix-main/
├── app/
│   ├── routes/
│   │   ├── api.create-temp-product.tsx    # Geçici ürün oluşturma endpoint
│   │   ├── api.calculate-price.tsx        # Fiyat hesaplama endpoint
│   │   └── api.cleanup-temp-products.tsx  # Otomatik temizlik endpoint
│   ├── utils/
│   │   ├── pricing.server.ts              # Fiyatlama kuralları ve mantığı
│   │   └── product.server.ts              # Shopify ürün yönetimi
│   ├── db.server.ts                       # Prisma database client
│   └── shopify.server.ts                  # Shopify API yapılandırması
├── extensions/
│   └── dynamic-price-calculator/          # Tema extension
│       ├── blocks/
│       │   └── dynamic-price-form.liquid  # Ürün sayfası formu
│       └── locales/
│           ├── tr.json                    # Türkçe çeviriler
│           └── en.default.json            # İngilizce çeviriler
├── prisma/
│   └── schema.prisma                      # Database şeması (TempProduct modeli)
├── .github/
│   └── workflows/
│       └── cleanup-cron.yml               # GitHub Actions cron job
├── .env                                   # Environment variables
├── shopify.app.toml                       # Shopify app yapılandırması
├── SETUP_GUIDE.md                         # API kurulum rehberi
├── CRON_SETUP.md                          # Cron job kurulum rehberi
└── TESTING_DEPLOYMENT.md                  # Test ve deployment rehberi
```

---

## 🚀 Hızlı Başlangıç

### 1. API Bilgilerini Ekleyin

`.env` dosyasını açın ve Shopify Partner Dashboard'dan aldığınız bilgileri girin:

```env
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
```

### 2. Bağımlılıkları Yükleyin

```powershell
npm install
```

### 3. Veritabanını Hazırlayın

```powershell
npm run setup
```

### 4. Uygulamayı Başlatın

```powershell
npm run dev
```

Bu komut:
- Shopify CLI'yi başlatır
- Ngrok tüneli açar
- Test mağazanıza bağlanmanızı ister
- Uygulamayı mağazaya kurar

### 5. Tema'ya Bloğu Ekleyin

1. Test mağazanızda: **Online Store** → **Themes** → **Customize**
2. Bir ürün sayfası açın
3. **"Add block"** → **"Apps"** → **"Dinamik Fiyat Hesaplayıcı"**
4. **Save** edin

### 6. Test Edin!

Vitrin'de herhangi bir ürün sayfasını açın:
- Boy: `400`
- En: `500`
- Materyal: `Ahşap`
- Beklenen Fiyat: `74.00 $`

---

## 🛠️ Teknolojiler

- **Framework**: Remix (React)
- **Platform**: Shopify App
- **Database**: Prisma + SQLite (development) / PostgreSQL (production)
- **Theme Integration**: Liquid (Shopify Theme Extension)
- **API**: Shopify GraphQL Admin API
- **Hosting**: Shopify

---

## 🔧 Yapılandırma

### Geçici Ürünleri Katalogdan Gizleme Mantığı

Geçici ürünler `productSet` mutasyonu sırasında Online Store'a "UNLISTED" olarak publish edilir ve şu etiketler eklenir:

```
temp-product, temp-hidden, auto-delete, material-<kod>
```

Bu sayede:
1. Kolleksiyon / arama sonuçlarında görünmez (tema arama/filtre logic'inizde `temp-hidden` etiketini dışlayın).
2. Doğrudan URL (product.handle) ile erişilebilir ve sepete eklenebilir.
3. 2 saat sonra otomatik silinmek üzere işaretlenir.

Tema düzeyinde ekstra koruma için `collection.liquid` ve `search.liquid` içinde ürün döngüsünde şu kontrol eklenebilir:

```liquid
{% unless product.tags contains 'temp-hidden' %}
  <!-- Ürünü normal şekilde göster -->
  {{ product.title }}
{% endunless %}
```
### Fiyatlama Kurallarını Değiştirme

`app/utils/pricing.server.ts` dosyasını düzenleyin:

```typescript
const PRICE_RANGES: PriceRange[] = [
  { min: 0, max: 100000, coefficient: 1.0 },
  { min: 100000, max: 200000, coefficient: 1.2 },
  // Yeni aralık ekle
  { min: 200000, max: 300000, coefficient: 1.5 },
  { min: 300000, max: Infinity, coefficient: 2.0 }
];
```

### Materyal Fiyatlarını Değiştirme

```typescript
export const MATERIAL_PRICES = {
  wood: 50,    // Ahşap
  metal: 100,  // Metal
  plastic: 30, // Plastik
  // Yeni materyal ekle
  glass: 75    // Cam
} as const;
```

### Temizlik Süresini Değiştirme

`app/routes/api.create-temp-product.tsx`:

```typescript
// 2 saat yerine 4 saat
const deleteAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);
```

---

## 🧪 Test Komutları

### Fiyat Hesaplama Testi

```powershell
$body = @{
    height = 400
    width = 500
    material = "wood"
}
Invoke-RestMethod -Uri "http://localhost:5173/api/calculate-price" -Method POST -Body $body
```

### Geçici Ürün Oluşturma Testi

```powershell
$body = @{
    height = 400
    width = 500
    material = "wood"
}
Invoke-RestMethod -Uri "http://localhost:5173/api/create-temp-product" -Method POST -Body $body
```

### Manuel Temizlik Testi

```powershell
$headers = @{
    "X-Cron-Secret" = "change-me-in-production-to-secure-random-token"
}
Invoke-RestMethod -Uri "http://localhost:5173/api/cleanup-temp-products" -Method POST -Headers $headers
```

## 📞 İletişim

ahmetyuceler.com.tr
ccahmetyucelercc@gmail.com
+905535651310
