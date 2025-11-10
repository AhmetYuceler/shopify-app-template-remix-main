/**
 * Shopify App Proxy Route: Temporary Product Creation
 * 
 * Accessible endpoint from storefront (via Shopify App Proxy)
 * URL: https://[store].myshopify.com/apps/[proxy-path]/create-temp-product
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }
  
  try {
    // Shopify authentication
    const { admin, session } = await authenticate.public.appProxy(request);
    
    if (!session) {
      return json(
        { success: false, error: "Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

    const formData = await request.formData();
    const height = parseInt(formData.get("height") as string);
    const width = parseInt(formData.get("width") as string);
    const material = formData.get("material") as string;
    const imageUrl = formData.get("imageUrl") as string | null;
    
    // Validation
    const errors = validateInputs(height, width, material);
    if (errors.length > 0) {
      return json(
        { success: false, error: errors.join(", ") },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Calculate price
    const price = calculatePrice(height, width, material as MaterialType);
    const materialName = MATERIAL_NAMES[material as MaterialType];
    
    // 1) Is there an existing temp product? (within 2-hour TTL, not deleted)
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
      const existingTitle = `Custom Frame ${height}×${width}mm - ${materialName}`;
      console.log(`[ProxyTempProduct] Reuse existing: ${existing.productId}`);
      return json(
        {
          success: true,
          product: {
            id: existing.id,
            productId: existing.productId,
            variantId: existing.variantId,
            title: existingTitle,
            price,
            height,
            width,
            material: materialName
          }
        },
        { headers: corsHeaders }
      );
    }

    // 2) Otherwise, create a temp product in Shopify
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

    // 3) Save to database (to be deleted after 2 hours)
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

    console.log(`[ProxyTempProduct] Created: ${productId} - ${title}`);

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
    console.error("[ProxyTempProduct] Error:", error);
    
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create product"
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export const loader = async () => {
  return json(
    { error: "POST request required" },
    { status: 405, headers: corsHeaders }
  );
};
