/**
 * API Route: Geçici Ürün Oluşturma ve Fiyat Hesaplama
 * 
 * POST /api/create-temp-product
 * - Boy, En, Materyal bilgilerini alır
 * - Fiyat hesaplar
 * - Shopify'da geçici ürün oluşturur
 * - Veritabanına kaydeder (2 saat sonra silinmek üzere)
 */

import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {
  calculatePrice,
  validateInputs,
  MATERIAL_NAMES,
  type MaterialType
} from "../utils/pricing.server";
import {
  createTempProduct,
  type TempProductData
} from "../utils/product.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Shopify authentication
  const { admin, session } = await authenticate.admin(request);
  
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  
  try {
    // Request body'den verileri al
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
    const materialName = MATERIAL_NAMES[material as MaterialType];
    
    // Shopify'da geçici ürün oluştur
    const productData: TempProductData = {
      height,
      width,
      material,
      materialName,
      price
    };
    
    const { productId, variantId, title } = await createTempProduct(
      admin,
      productData
    );
    
    // Veritabanına kaydet (2 saat sonra silinmek üzere)
    const now = new Date();
    const deleteAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 saat
    
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
    
    console.log(`[TempProduct] Oluşturuldu: ${productId} - ${title}`);
    console.log(`[TempProduct] Silinme zamanı: ${deleteAt.toISOString()}`);
    
    return json({
      success: true,
      product: {
        id: tempProduct.id,
        productId,
        variantId,
        title,
        price,
        height,
        width,
        material: materialName
      }
    });
    
  } catch (error) {
    console.error("[TempProduct] Oluşturma hatası:", error);
    
    return json(
      {
        error: error instanceof Error ? error.message : "Ürün oluşturulamadı"
      },
      { status: 500 }
    );
  }
};
