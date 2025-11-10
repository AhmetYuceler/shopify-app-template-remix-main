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
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { createTempProduct, type TempProductData } from "../utils/product.server";
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

    // Shopify auth (ürün oluşturmak/reuse etmek için) - başarısız olursa sadece fiyat döner
    let productPayload: any = null;
    try {
      const { admin, session } = await authenticate.public.appProxy(request);
      if (session) {
        // VAR OLAN ürün var mı? (TTL ve parametre eşleşmeli)
        const existing = await db.tempProduct.findFirst({
          where: {
            shop: session.shop,
            height,
            width,
            material,
            deleted: false,
            deleteAt: { gt: new Date() }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (existing) {
          productPayload = {
            id: existing.id,
            productId: existing.productId,
            variantId: existing.variantId,
            title: `Özel Çerçeve ${height}×${width}mm - ${MATERIAL_NAMES[material as MaterialType]}`,
            price,
            height,
            width,
            material: MATERIAL_NAMES[material as MaterialType]
          };
        } else {
          const productData: TempProductData = {
            height,
            width,
            material,
            materialName: MATERIAL_NAMES[material as MaterialType],
            price
          };
          const { productId, variantId, title } = await createTempProduct(admin, productData);
          const now = new Date();
          const deleteAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 saat TTL
          const tempProduct = await db.tempProduct.create({
            data: {
              shop: session.shop,
              productId,
              variantId,
              height,
              width,
              material,
              price,
              deleteAt
            }
          });
          productPayload = {
            id: tempProduct.id,
            productId,
            variantId,
            title,
            price,
            height,
            width,
            material: MATERIAL_NAMES[material as MaterialType]
          };
        }
      }
    } catch (e) {
      console.warn('[ProxyPriceCalculation] Ürün oluşturma/reuse atlandı:', e instanceof Error ? e.message : e);
    }

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
        },
        product: productPayload
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
