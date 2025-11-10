/**
 * App Proxy Route: Geçici Ürün Oluşturma
 * 
 * Shopify storefront'tan /apps/proxy/create-temp-product olarak çağrılır
 * Backend'e /create-temp-product olarak gelir
 */

import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }: LoaderFunctionArgs) {
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
    // Shopify App Proxy authentication
    const { admin, session } = await authenticate.public.appProxy(request);
    
    if (!session) {
      console.error("[AppProxy] Session bulunamadı - authentication başarısız");
      return json(
        { success: false, error: "Geçerli oturum bulunamadı" },
        { status: 401, headers: corsHeaders }
      );
    }

    const formData = await request.formData();
    const height = parseInt(formData.get("height") as string);
    const width = parseInt(formData.get("width") as string);
    const material = formData.get("material") as string;
    const imageUrl = formData.get("imageUrl") as string || "";
    
    console.log(`[AppProxy] Geçici ürün oluştur: height=${height}, width=${width}, material=${material}, imageUrl=${imageUrl}, shop=${session.shop}`);
    
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
    const materialName = MATERIAL_NAMES[material as MaterialType];
    
    // Shopify'da geçici ürün oluştur
    const productData: TempProductData = {
      height,
      width,
      material,
      materialName,
      price,
      imageUrl: imageUrl || undefined
    };
    
    const { productId, variantId, title } = await createTempProduct(
      admin,
      productData
    );
    
    // Veritabanına kaydet (2 saat sonra silinmek üzere)
    const now = new Date();
    const deleteAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
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
    
    console.log(`[AppProxy] Oluşturuldu: ${productId} - ${title}, silinme: ${deleteAt.toISOString()}`);
    
    return json(
      {
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
      },
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error("[AppProxy] Geçici ürün oluşturma hatası:", error);
    
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Ürün oluşturulamadı"
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
