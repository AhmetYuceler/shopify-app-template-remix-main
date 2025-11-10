/**
 * App Proxy Route: Fiyat Hesaplama
 * 
 * Shopify storefront'tan /apps/proxy/calculate-price olarak çağrılır
 * Backend'e /calculate-price olarak gelir
 */

import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  calculatePrice,
  validateInputs,
  getCoefficient,
  MATERIAL_NAMES,
  MATERIAL_PRICES,
  type MaterialType
} from "../utils/pricing.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }: LoaderFunctionArgs) {
  // Shopify proxy signature validation burada yapılabilir
  return json({ status: "ok", method: "GET" }, { headers: corsHeaders });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "POST method required" }, { status: 405, headers: corsHeaders });
  }
  
  try {
    const formData = await request.formData();
    const height = parseInt(formData.get("height") as string);
    const width = parseInt(formData.get("width") as string);
    const material = formData.get("material") as string;
    
    console.log(`[AppProxy] Fiyat hesaplama: height=${height}, width=${width}, material=${material}`);
    
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
    
    const result = {
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
    };
    
    console.log(`[AppProxy] Fiyat hesaplandı: ${price.toFixed(2)} $`);
    
    return json(result, { headers: corsHeaders });
    
  } catch (error) {
    console.error("[AppProxy] Fiyat hesaplama hatası:", error);
    
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Fiyat hesaplanamadı"
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
