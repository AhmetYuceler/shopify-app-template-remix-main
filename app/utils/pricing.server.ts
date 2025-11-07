/**
 * Fiyatlama Kuralları ve Hesaplama Fonksiyonları
 * 
 * Bu dosya dinamik fiyat hesaplama mantığını içerir:
 * - Boy × En'e göre katsayı belirleme
 * - Materyal fiyatları
 * - Toplam fiyat hesaplama
 */

// Materyal fiyatları (TL)
export const MATERIAL_PRICES = {
  wood: 50,    // Ahşap
  metal: 100,  // Metal
  plastic: 30  // Plastik
} as const;

export type MaterialType = keyof typeof MATERIAL_PRICES;

// Materyal isimleri (UI için)
export const MATERIAL_NAMES: Record<MaterialType, string> = {
  wood: "Ahşap",
  metal: "Metal",
  plastic: "Plastik"
};

// Boy × En aralıklarına göre katsayılar
interface PriceRange {
  min: number;      // Minimum alan (mm²)
  max: number;      // Maximum alan (mm²)
  coefficient: number; // Fiyat katsayısı
}

const PRICE_RANGES: PriceRange[] = [
  { min: 0, max: 100000, coefficient: 1.0 },
  { min: 100000, max: 200000, coefficient: 1.2 },
  { min: 200000, max: 300000, coefficient: 1.5 },
  { min: 300000, max: Infinity, coefficient: 2.0 }
];

/**
 * Boy ve En'e göre fiyat katsayısını hesaplar
 * @param height Boy (mm)
 * @param width En (mm)
 * @returns Fiyat katsayısı
 */
export function getCoefficient(height: number, width: number): number {
  const area = height * width;
  
  const range = PRICE_RANGES.find(
    r => area >= r.min && area < r.max
  );
  
  return range?.coefficient || PRICE_RANGES[PRICE_RANGES.length - 1].coefficient;
}

/**
 * Toplam fiyatı hesaplar
 * Formül: (Boy × En × Katsayı / 10000) + Materyal Fiyatı
 * 
 * @param height Boy (mm)
 * @param width En (mm)
 * @param material Materyal tipi
 * @returns Hesaplanan fiyat (TL)
 */
export function calculatePrice(
  height: number,
  width: number,
  material: MaterialType
): number {
  const coefficient = getCoefficient(height, width);
  const materialPrice = MATERIAL_PRICES[material];
  const area = height * width;
  
  // (Alan × Katsayı / 10000) + Materyal Fiyatı
  const price = (area * coefficient / 10000) + materialPrice;
  
  // 2 ondalık basamağa yuvarla
  return Math.round(price * 100) / 100;
}

/**
 * Form doğrulama kuralları
 */
export const VALIDATION_RULES = {
  height: {
    min: 100,     // Minimum 100mm
    max: 5000,    // Maximum 5000mm (5 metre)
    errorMessage: "Boy 100mm ile 5000mm arasında olmalıdır"
  },
  width: {
    min: 100,     // Minimum 100mm
    max: 5000,    // Maximum 5000mm (5 metre)
    errorMessage: "En 100mm ile 5000mm arasında olmalıdır"
  }
} as const;

/**
 * Input değerlerini doğrular
 * @param height Boy (mm)
 * @param width En (mm)
 * @param material Materyal
 * @returns Hata mesajları (varsa)
 */
export function validateInputs(
  height: number,
  width: number,
  material: string
): string[] {
  const errors: string[] = [];
  
  // Boy kontrolü
  if (height < VALIDATION_RULES.height.min || height > VALIDATION_RULES.height.max) {
    errors.push(VALIDATION_RULES.height.errorMessage);
  }
  
  // En kontrolü
  if (width < VALIDATION_RULES.width.min || width > VALIDATION_RULES.width.max) {
    errors.push(VALIDATION_RULES.width.errorMessage);
  }
  
  // Materyal kontrolü
  if (!Object.keys(MATERIAL_PRICES).includes(material)) {
    errors.push("Geçerli bir materyal seçiniz");
  }
  
  return errors;
}

/**
 * Fiyat bilgisi formatlar (UI için)
 * @param price Fiyat
 * @returns Formatlanmış fiyat string'i
 */
export function formatPrice(price: number): string {
  return `${price.toFixed(2)} TL`;
}

/**
 * Test fonksiyonu - Fiyatlama kurallarını test eder
 */
export function testPricing() {
  console.log("=== Fiyatlama Test Sonuçları ===\n");
  
  const testCases = [
    { height: 200, width: 300, material: "wood" as MaterialType },
    { height: 400, width: 500, material: "metal" as MaterialType },
    { height: 600, width: 600, material: "plastic" as MaterialType },
    { height: 1000, width: 1000, material: "wood" as MaterialType }
  ];
  
  testCases.forEach(({ height, width, material }) => {
    const area = height * width;
    const coefficient = getCoefficient(height, width);
    const price = calculatePrice(height, width, material);
    
    console.log(`Boy: ${height}mm, En: ${width}mm, Materyal: ${MATERIAL_NAMES[material]}`);
    console.log(`  Alan: ${area.toLocaleString()} mm²`);
    console.log(`  Katsayı: ${coefficient}`);
    console.log(`  Fiyat: ${formatPrice(price)}\n`);
  });
}
