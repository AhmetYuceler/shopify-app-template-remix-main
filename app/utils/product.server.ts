/**
 * Geçici Ürün Yönetimi Fonksiyonları
 * 
 * Shopify'da geçici ürün oluşturma, güncelleme ve silme işlemleri
 */

export interface TempProductData {
  height: number;
  width: number;
  material: string;
  materialName: string;
  price: number;
  originalProductId?: string;
}

// Admin context type (GraphQL API)
type AdminContext = {
  graphql: (query: string, options?: { variables?: Record<string, any> }) => Promise<Response>;
};

/**
 * Shopify'da geçici ürün oluşturur
 * @param admin Shopify Admin API context
 * @param data Ürün bilgileri
 * @returns Oluşturulan ürün ve varyant ID'leri
 */
export async function createTempProduct(
  admin: AdminContext,
  data: TempProductData
) {
  const { height, width, material, materialName, price } = data;
  
  // Ürün başlığı
  const title = `Özel Çerçeve ${height}×${width}mm - ${materialName}`;
  
  // Ürün açıklaması
  const descriptionHtml = `
    <p><strong>Özelleştirilmiş Çerçeve</strong></p>
    <ul>
      <li>Boy: ${height}mm</li>
      <li>En: ${width}mm</li>
      <li>Materyal: ${materialName}</li>
      <li>Fiyat: ${price.toFixed(2)} TL</li>
    </ul>
    <p><em>Not: Bu ürün özel siparişiniz için oluşturulmuştur.</em></p>
  `;
  
  // GraphQL mutation
  const CREATE_PRODUCT_MUTATION = `
    mutation createProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          variants(first: 1) {
            edges {
              node {
                id
                price
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const response = await admin.graphql(CREATE_PRODUCT_MUTATION, {
    variables: {
      input: {
        title,
        descriptionHtml,
        productType: "Geçici Ürün",
        vendor: "Dinamik Fiyat Sistemi",
        tags: ["temp-product", "auto-delete", `material-${material}`],
        status: "ACTIVE",
        variants: [
          {
            price: price.toString(),
            inventoryPolicy: "CONTINUE",
            inventoryManagement: null,
            requiresShipping: true
          }
        ]
      }
    }
  });
  
  const result = await response.json();
  
  if (result.data?.productCreate?.userErrors?.length > 0) {
    throw new Error(
      `Ürün oluşturma hatası: ${result.data.productCreate.userErrors[0].message}`
    );
  }
  
  const product = result.data.productCreate.product;
  const variant = product.variants.edges[0].node;
  
  return {
    productId: product.id.split('/').pop() || "",
    variantId: variant.id.split('/').pop() || "",
    title: product.title
  };
}

/**
 * Geçici ürünü Shopify'dan siler
 * @param admin Shopify Admin API context
 * @param productId Silinecek ürün ID'si
 */
export async function deleteTempProduct(
  admin: AdminContext,
  productId: string
) {
  const DELETE_PRODUCT_MUTATION = `
    mutation deleteProduct($input: ProductDeleteInput!) {
      productDelete(input: $input) {
        deletedProductId
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  // ID formatını düzelt (gid://shopify/Product/123 formatında olmalı)
  const gid = productId.startsWith("gid://") 
    ? productId 
    : `gid://shopify/Product/${productId}`;
  
  const response = await admin.graphql(DELETE_PRODUCT_MUTATION, {
    variables: {
      input: {
        id: gid
      }
    }
  });
  
  const result = await response.json();
  
  if (result.data?.productDelete?.userErrors?.length > 0) {
    throw new Error(
      `Ürün silme hatası: ${result.data.productDelete.userErrors[0].message}`
    );
  }
  
  return result.data.productDelete.deletedProductId;
}

/**
 * Toplu geçici ürün silme
 * @param admin Shopify Admin API context
 * @param productIds Silinecek ürün ID'leri
 */
export async function bulkDeleteTempProducts(
  admin: AdminContext,
  productIds: string[]
) {
  const results = {
    success: [] as string[],
    failed: [] as { id: string; error: string }[]
  };
  
  // Her ürünü tek tek sil
  for (const productId of productIds) {
    try {
      await deleteTempProduct(admin, productId);
      results.success.push(productId);
    } catch (error) {
      results.failed.push({
        id: productId,
        error: error instanceof Error ? error.message : "Bilinmeyen hata"
      });
    }
  }
  
  return results;
}

/**
 * Ürünü sepete eklemek için gerekli bilgileri hazırlar
 * @param variantId Varyant ID'si
 * @param quantity Miktar
 * @param properties Özel özellikler (boy, en, materyal)
 */
export function prepareCartItem(
  variantId: string,
  quantity: number = 1,
  properties: Record<string, string>
) {
  return {
    id: variantId,
    quantity,
    properties: Object.entries(properties).map(([key, value]) => ({
      key,
      value
    }))
  };
}

/**
 * Geçici ürün etiketlerini kontrol eder
 * @param tags Ürün etiketleri
 * @returns Geçici ürün mü?
 */
export function isTempProduct(tags: string[]): boolean {
  return tags.includes("temp-product");
}
