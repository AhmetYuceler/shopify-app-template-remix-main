# 🎯 Shopify Uygulaması Kullanım Rehberi

## ✅ DURUM: Uygulamanız Çalışıyor!

**Mağaza:** remixapp-2.myshopify.com  
**Uygulama Adı:** rmx-yuceler  
**Cloudflare URL:** https://blank-explained-reporters-correlation.trycloudflare.com  
**Local URL:** http://localhost:64034/

---

## 📋 ADIM 1: Uygulamayı Kurma (İLK SEFER)

### 1. Preview URL'yi Açın:
```
https://remixapp-2.myshopify.com/admin/oauth/redirect_from_cli?client_id=e213ff3aa620fe7c451ff52ce9b26c41
```

### 2. "Install app" Butonuna Tıklayın

### 3. İzinleri Onaylayın:
- ✅ Ürün okuma/yazma
- ✅ Tema okuma  
- ✅ Taslak sipariş yazma

---

## 📱 ADIM 2: Uygulamayı Admin'de Görüntüleme

### 1. Shopify Admin'e Gidin:
```
https://remixapp-2.myshopify.com/admin
```

### 2. Sol Menüden "Apps" (Uygulamalar) → "rmx-yuceler" Tıklayın

Burada uygulamanızın admin panelini göreceksiniz!

---

## 🎨 ADIM 3: Tema Editöründe Kullanma (ÖNEMLİ!)

### 1. Tema Editörüne Gidin:
```
https://remixapp-2.myshopify.com/admin/themes/186071548085/editor
```

VEYA:
- Shopify Admin → **Online Store** → **Themes** → **Customize**

### 2. Ürün Sayfasını Açın:

a) Tema editörünün **üst ortasındaki dropdown'dan** "Products" → "Default product" seçin

b) VEYA soldaki navigasyondan herhangi bir ürüne tıklayın

### 3. Dynamic Price Calculator Bloğunu Ekleyin:

#### Yöntem A: Sol Panelden Ekleme
1. Sol panelde **mavi "+" (Add section/block)** butonuna tıklayın
2. **"Apps"** kategorisini bulun
3. **"Dynamic Price Calculator"** bloğunu seçin
4. Sağ üstten **"Save"** (Kaydet) butonuna tıklayın

#### Yöntem B: Product Info İçine Ekleme
1. Sol panelde **"Product information"** bölümünü bulun
2. Üzerine tıklayıp genişletin
3. İçindeki **"Add block"** (Blok ekle) butonuna tıklayın
4. **"Apps"** → **"Dynamic Price Calculator"**
5. **"Save"** ile kaydedin

### 4. Tema Değişikliklerini Yayınlayın:
- Sağ üstten **"Save"** butonuna basın
- Eğer isterse **"Publish"** (Yayınla) deyin

---

## 🛍️ ADIM 4: Mağaza Vitrininde Test Etme

### 1. Mağaza Vitrinini Açın:
```
https://remixapp-2.myshopify.com
```

### 2. Herhangi Bir Ürün Sayfasına Gidin

### 3. Dynamic Price Calculator Formunu Göreceksiniz:

**Form Alanları:**
- 📏 **Boy (mm)**: Örn: 1000
- 📏 **En (mm)**: Örn: 500
- 🎨 **Materyal**: Ahşap / Metal / Plastik

### 4. Değerleri Doldurun ve Fiyatı Görün:

**Örnek:**
- Boy: 1000 mm
- En: 500 mm
- Materyal: Ahşap (50 TL)

**Hesaplama:**
```
Alan = 1000 × 500 = 500,000 mm²
Katsayı = 2.0 (300,000+ için)
Fiyat = (500,000 × 2.0 / 10,000) + 50 = 100 + 50 = 150 TL
```

### 5. "Sepete Ekle" Butonuna Tıklayın

### 6. Sepeti Kontrol Edin:
- Özel fiyatlı ürün sepette olacak
- Ürün adı: "Özel Ölçülü [Orijinal Ürün Adı]"
- Fiyat: Hesaplanan fiyat
- Meta bilgiler: Boy, En, Materyal

---

## 🔧 Fiyatlama Kuralları

### Katsayılar (Alan Bazlı):
- **0 - 100,000 mm²**: Katsayı = 1.0
- **100,000 - 200,000 mm²**: Katsayı = 1.2
- **200,000 - 300,000 mm²**: Katsayı = 1.5
- **300,000+ mm²**: Katsayı = 2.0

### Materyal Fiyatları:
- 🌳 **Ahşap**: 50 TL
- 🔩 **Metal**: 100 TL
- 🔷 **Plastik**: 30 TL

### Formül:
```
Fiyat = (Boy × En × Katsayı / 10,000) + Materyal Fiyatı
```

---

## 🎯 Özellikler

✨ **Dinamik fiyat hesaplama** - Gerçek zamanlı güncelleme  
🛒 **Otomatik sepete ekleme** - Özel fiyatla  
⏰ **Otomatik temizlik** - 2 saat sonra geçici ürünler silinir  
📱 **Responsive tasarım** - Mobil uyumlu  
🌍 **Çoklu dil** - TR/EN desteği  

---

## 🐛 Sorun Giderme

### Blok Görünmüyorsa:
1. Tema editöründe **"Apps"** kategorisini kontrol edin
2. Tarayıcı cache'ini temizleyin (Ctrl + Shift + Delete)
3. Uygulamayı yeniden yükleyin

### Fiyat Hesaplanmıyorsa:
1. Terminal'de `npm run dev` çalıştığından emin olun
2. Tarayıcı console'da (F12) hata var mı kontrol edin
3. API endpoint'lerini test edin

### Sepete Eklenmiyor:
1. Ürün scope'larının doğru olduğundan emin olun
2. Shopify Admin → Apps → rmx-yuceler → "App permissions" kontrol edin

---

## 📞 Terminal Komutları

### Uygulamayı Başlatma:
```powershell
npm run dev
```

### Uygulamayı Durdurma:
Terminal'de **Ctrl + C**

### Veritabanını Sıfırlama:
```powershell
npm run setup
```

### Deploy (Canlıya Alma):
```powershell
npm run deploy
```

---

## 🎊 Başarılı Test Senaryosu

1. ✅ Tema editörüne gir
2. ✅ Ürün sayfasına blok ekle
3. ✅ Kaydet ve yayınla
4. ✅ Mağaza vitrininde ürün aç
5. ✅ Formu doldur (Boy: 1500, En: 800, Materyal: Metal)
6. ✅ Fiyatın hesaplandığını gör (340 TL)
7. ✅ Sepete ekle
8. ✅ Sepette özel ürünü gör
9. ✅ Ödeme işlemine geç (test modu!)