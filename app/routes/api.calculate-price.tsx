/**
 * API Route: Fiyat Hesaplama (Önizleme)
 * 
 * POST /api/calculate-price
 * - Boy, En, Materyal bilgilerini alır
 * - Fiyatı hesaplayıp döndürür (ürün oluşturmaz)
 * - Frontend'de dinamik fiyat gösterimi için kullanılır
 */

import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import {
  calculatePrice,
  validateInputs,
  getCoefficient,
  MATERIAL_NAMES,
  MATERIAL_PRICES,
  type MaterialType
} from "../utils/pricing.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  
  try {
    const formData = await request.formData();
    const height = parseInt(formData.get("height") as string);
    const width = parseInt(formData.get("width") as string);
    const material = formData.get("material") as string;
    
    // Validasyon
    const errors = validateInputs(height, width, material);
    if (errors.length > 0) {
      return json({ error: errors.join(", ") }, { status: 400 });
    }
    
    // Fiyat hesapla
    const price = calculatePrice(height, width, material as MaterialType);
    const coefficient = getCoefficient(height, width);
    const area = height * width;
    
    return json({
      success: true,
      calculation: {
        height,
        width,
        material: MATERIAL_NAMES[material as MaterialType],
        area,
        coefficient,
        materialPrice: MATERIAL_PRICES[material as MaterialType],
        totalPrice: price,
        formatted: `${price.toFixed(2)} $`
      }
    });
    
  } catch (error) {
    console.error("[PriceCalculation] Hata:", error);
    
    return json(
      {
        error: error instanceof Error ? error.message : "Fiyat hesaplanamadı"
      },
      { status: 500 }
    );
  }
};
