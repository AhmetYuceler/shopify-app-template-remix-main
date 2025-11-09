/**
 * Shopify App Proxy Route: Fiyat Hesaplama
 * 
 * Storefront'tan erişilebilir endpoint
 * URL: https://[store].myshopify.com/apps/[proxy-path]/calculate-price
 * 
 * Bu route Shopify App Proxy üzerinden çalışır
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

// CORS headers ekle
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function action({ request }: ActionFunctionArgs) {
  // OPTIONS request için CORS
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }
  
  try {
    const formData = await request.formData();
    const height = parseInt(formData.get("height") as string);
    const width = parseInt(formData.get("width") as string);
    const material = formData.get("material") as string;
    
    // Validasyon
    const errors = validateInputs(height, width, material);
    if (errors.length > 0) {
      return json(
        { success: false, error: errors.join(", ") },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Fiyat hesapla
    const price = calculatePrice(height, width, material as MaterialType);
    const coefficient = getCoefficient(height, width);
    const area = height * width;
    
    return json(
      {
        success: true,
        calculation: {
          height,
          width,
          material: MATERIAL_NAMES[material as MaterialType],
          area,
          coefficient,
          materialPrice: MATERIAL_PRICES[material as MaterialType],
          totalPrice: price,
          formatted: `${price.toFixed(2)} TL`
        }
      },
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error("[ProxyPriceCalculation] Hata:", error);
    
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Fiyat hesaplanamadı"
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET request için de aynı handler
export const loader = async () => {
  return json(
    { error: "POST request gerekli" },
    { status: 405, headers: corsHeaders }
  );
};
