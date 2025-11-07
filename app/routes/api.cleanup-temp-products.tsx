/**
 * API Route: Otomatik Geçici Ürün Temizliği
 * 
 * POST /api/cleanup-temp-products
 * - 2 saati dolmuş geçici ürünleri bulur
 * - Shopify'dan siler
 * - Veritabanında işaretler
 * 
 * Bu endpoint bir cron job tarafından düzenli çağrılmalıdır
 * (örn: her 10 dakikada bir)
 */

import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { bulkDeleteTempProducts } from "../utils/product.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // CRON_SECRET ile güvenlik kontrolü
    const cronSecret = request.headers.get("X-Cron-Secret");
    const expectedSecret = process.env.CRON_SECRET || "change-me-in-production-to-secure-random-token";

    if (cronSecret !== expectedSecret) {
      console.warn("[Cleanup] Yetkisiz erişim denemesi");
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Shopify authentication (admin session kullan)
    const { admin } = await authenticate.admin(request);

    // Silinmesi gereken ürünleri bul
    const now = new Date();
    const productsToDelete = await db.tempProduct.findMany({
      where: {
        deleteAt: {
          lte: now // deleteAt <= şimdi
        },
        deleted: false
      }
    });

    if (productsToDelete.length === 0) {
      console.log("[Cleanup] Silinecek ürün yok");
      return json({
        success: true,
        message: "Silinecek ürün bulunamadı",
        deleted: 0
      });
    }

    console.log(`[Cleanup] ${productsToDelete.length} ürün silinecek`);

    // Shopify'dan toplu silme
    const productIds = productsToDelete.map((p: any) => p.productId);
    const deleteResults = await bulkDeleteTempProducts(admin, productIds);

    // Veritabanında işaretle
    const deletedIds = deleteResults.success.map((productId) => {
      const product = productsToDelete.find((p: any) => p.productId === productId);
      return product?.id;
    }).filter(Boolean) as string[];

    if (deletedIds.length > 0) {
      await db.tempProduct.updateMany({
        where: {
          id: {
            in: deletedIds
          }
        },
        data: {
          deleted: true
        }
      });
    }

    // Log kaydet
    console.log(`[Cleanup] Başarılı: ${deleteResults.success.length}`);
    console.log(`[Cleanup] Başarısız: ${deleteResults.failed.length}`);

    if (deleteResults.failed.length > 0) {
      console.error("[Cleanup] Hatalar:", deleteResults.failed);
    }

    return json({
      success: true,
      message: `${deleteResults.success.length} ürün silindi`,
      deleted: deleteResults.success.length,
      failed: deleteResults.failed.length,
      errors: deleteResults.failed
    });

  } catch (error) {
    console.error("[Cleanup] Kritik hata:", error);

    return json(
      {
        error: error instanceof Error ? error.message : "Temizlik işlemi başarısız"
      },
      { status: 500 }
    );
  }
};

// GET endpoint - manuel temizlik tetiklemek için (development)
export const loader = async ({ request }: ActionFunctionArgs) => {
  // Sadece development modunda izin ver
  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv === "production") {
    return json({ error: "Not available in production" }, { status: 403 });
  }

  const cronSecret = process.env.CRON_SECRET || "change-me-in-production-to-secure-random-token";

  return json({
    message: "POST isteği ile temizlik başlatabilirsiniz",
    example: {
      method: "POST",
      headers: {
        "X-Cron-Secret": cronSecret
      }
    }
  });
};
