/**
 * Temporary Product Management Functions
 * 
 * Shopify temporary product creation, update, and deletion operations
 */

export interface TempProductData {
  height: number;
  width: number;
  material: string;
  materialName: string;
  price: number;
  originalProductId?: string;
  imageUrl?: string;
}

// Admin context type (GraphQL API)
type AdminContext = {
  graphql: (query: string, options?: { variables?: Record<string, any> }) => Promise<Response>;
};

/**
 * Create a Draft Order and return checkout URL
 * Most reliable method for custom pricing!
 */
export async function createDraftOrder(
  admin: AdminContext,
  data: TempProductData,
  shopDomain: string
) {
  const { height, width, material, materialName, price } = data;
  
  const title = `Custom Frame ${height}×${width}mm - ${materialName}`;
  
  // Draft Order mutation
  const CREATE_DRAFT_ORDER = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          invoiceUrl
          totalPrice
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const response = await admin.graphql(CREATE_DRAFT_ORDER, {
    variables: {
      input: {
        lineItems: [
          {
            title: title,
            originalUnitPrice: price.toFixed(2),
            quantity: 1,
            customAttributes: [
              { key: "Height", value: `${height}mm` },
              { key: "Width", value: `${width}mm` },
              { key: "Material", value: materialName }
            ]
          }
        ],
        note: `Dynamic pricing: ${height}×${width}mm, ${materialName}`,
        tags: ["dynamic-price", `material-${material}`]
      }
    }
  });
  
  const result = await response.json();
  
  console.log(`[DraftOrder Debug]`, JSON.stringify(result, null, 2));
  
  if (result.data?.draftOrderCreate?.userErrors?.length > 0) {
    const errors = result.data.draftOrderCreate.userErrors;
    throw new Error(
      `Draft Order error: ${errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')}`
    );
  }
  
  const draftOrder = result.data.draftOrderCreate.draftOrder;
  const draftOrderId = draftOrder.id.split('/').pop();
  
  console.log(`[DraftOrder Success] ID: ${draftOrderId}, Total: ${draftOrder.totalPrice}`);
  
  return {
    draftOrderId,
    checkoutUrl: draftOrder.invoiceUrl,
    totalPrice: parseFloat(draftOrder.totalPrice)
  };
}

/**
 * Create a temporary product in Shopify
 * @param admin Shopify Admin API context
 * @param data Product information
 * @returns Created product and variant IDs
 */
export async function createTempProduct(
  admin: AdminContext,
  data: TempProductData
) {
  const { height, width, material, materialName, price, imageUrl } = data;
  
  // Product title
  const title = `Custom Frame ${height}×${width}mm - ${materialName}`;
  
  // Product description
  const descriptionHtml = `
    <p><strong>Customized Frame</strong></p>
    <ul>
      <li>Height: ${height}mm</li>
      <li>Width: ${width}mm</li>
      <li>Material: ${materialName}</li>
      <li>Price: ${price.toFixed(2)} $</li>
    </ul>
    <p><em>Note: This product was created for your custom order.</em></p>
  `;
  
  // Online Store publication ID'sini bul (publishablePublish için gerekli)
  console.log('[Info] Fetching publications for Online Store publish...');
  const PUBLICATIONS_QUERY = `
    query {
      publications(first: 10) {
        edges { node { id name } }
      }
    }
  `;
  let onlineStoreId: string | null = null;
  try {
    const pubsResp = await admin.graphql(PUBLICATIONS_QUERY);
    const pubsJson = await pubsResp.json();
    const edges = pubsJson.data?.publications?.edges || [];
    onlineStoreId = (edges.find((e: any) => e.node.name === 'Online Store')?.node?.id) || null;
    if (!onlineStoreId) {
      console.warn('[Publish] Online Store publication ID bulunamadı, publish denemesi atlanacak');
    } else {
      console.log('[Publish] Online Store publication ID:', onlineStoreId);
    }
  } catch (e) {
    console.warn('[Publish] Publication sorgusu hata verdi:', e instanceof Error ? e.message : e);
  }
  
  // productSet mutation ile ürünü oluştur (yayınlama ayrı adımda yapılacak)
  const PRODUCT_SET_MUTATION = `
    mutation productSet($input: ProductSetInput!, $synchronous: Boolean!) {
      productSet(input: $input, synchronous: $synchronous) {
        product {
          id
          title
          handle
          onlineStoreUrl
          variants(first: 1) {
            nodes {
              id
              price
            }
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;
  
  // Build product input
  const productInput: any = {
    title,
    descriptionHtml,
    productType: "Temporary Product",
    vendor: "Dynamic Price System",
    tags: ["temp-product", "temp-hidden", "auto-delete", `material-${material}`],
    status: "ACTIVE",
    productOptions: [
      {
        name: "Customization",
        values: [
          {
            name: `${height}×${width}mm ${materialName}`
          }
        ]
      }
    ],
    variants: [
      {
        optionValues: [
          {
            optionName: "Customization",
            name: `${height}×${width}mm ${materialName}`
          }
        ],
        price: price.toFixed(2),
        inventoryPolicy: "CONTINUE",
        inventoryItem: {
          tracked: false
        }
      }
    ]
  };
  
  // Add product image if available
  if (imageUrl && imageUrl.trim()) {
    // Ensure URL has protocol
    let fullImageUrl = imageUrl.trim();
    if (fullImageUrl.startsWith('//')) {
      fullImageUrl = 'https:' + fullImageUrl;
    } else if (!fullImageUrl.startsWith('http://') && !fullImageUrl.startsWith('https://')) {
      console.warn(`[ProductSet] Invalid image URL format: ${imageUrl}`);
      fullImageUrl = '';
    }
    
    if (fullImageUrl) {
      console.log(`[ProductSet] Adding image: ${fullImageUrl}`);
      productInput.media = [
        {
          originalSource: fullImageUrl,
          mediaContentType: "IMAGE",
          alt: title
        }
      ];
    }
  }
  
  const createResponse = await admin.graphql(PRODUCT_SET_MUTATION, {
    variables: {
      synchronous: true,
      input: productInput
    }
  });
  
  const createResult = await createResponse.json();
  
  // Debug: Full response'u logla
  console.log(`[ProductSet Debug] Response:`, JSON.stringify(createResult, null, 2));
  
  if (createResult.data?.productSet?.userErrors?.length > 0) {
    const errors = createResult.data.productSet.userErrors;
    console.error(`[ProductSet Error] UserErrors:`, errors);
    throw new Error(
      `Ürün oluşturma hatası: ${errors.map((e: any) => `${e.field}: ${e.message} (${e.code})`).join(', ')}`
    );
  }
  
  if (!createResult.data?.productSet?.product) {
    console.error(`[ProductSet Error] No product in response:`, createResult);
    throw new Error("Ürün oluşturulamadı - response'da product yok");
  }
  
  const product = createResult.data.productSet.product;
  const variant = product.variants.nodes[0];
  const variantIdNumber = variant.id.split('/').pop() || "";
  const variantPrice = variant.price || "0";
  
  console.log(`[ProductSet Success] Product: ${product.id}, Variant: ${variant.id}, Price: ${variantPrice}`);
  
  if (parseFloat(variantPrice) === 0) {
    console.warn(`[Warning] Variant price is 0 - expected ${price.toFixed(2)}`);
  } else {
    console.log(`[Success] Variant price set to: ${variantPrice} $`);
  }
  
  console.log(`[Success] ✅ Product created (temp-hidden)`);

  // Ürünü Online Store'da yayına al (geçerli kanal). Hata olursa devam ediyoruz fakat published=false döneceğiz.
  let publishedProduct: any = null;
  if (onlineStoreId) {
    try {
      // Ürünü Online Store'da LISTED olarak yayınla
      const PUBLISH_MUTATION = `
        mutation PublishProductToOnlineStore($id: ID!, $publicationId: ID!) {
          publishablePublish(id: $id, input: [{ publicationId: $publicationId }]) {
            publishable {
              ... on Product {
                id
                title
                onlineStoreUrl
                status
              }
            }
            userErrors { field message }
          }
        }
      `;

      const publishResp = await admin.graphql(PUBLISH_MUTATION, {
        variables: {
          id: product.id,
          publicationId: onlineStoreId
        }
      });
      const publishResult = await publishResp.json();
      console.log(`[Publish Debug]`, JSON.stringify(publishResult, null, 2));

      const pubErrors = publishResult.data?.publishablePublish?.userErrors || [];
      if (pubErrors.length > 0) {
        throw new Error(`Yayınlama hatası: ${pubErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ')}`);
      }

      publishedProduct = publishResult.data?.publishablePublish?.publishable;
      if (!publishedProduct) {
        console.warn(`[Publish Warning] publishablePublish sonucu beklenen ürünü döndürmedi.`);
      } else {
        console.log(`[Publish Success] ✅ Product published to Online Store (LISTED)`);
      }
    } catch (e) {
      // Yayınlama hatasında detaylı hata ver, üst katmana taşı
      if (e instanceof Error) throw e;
      throw new Error('Yayınlama hatası');
    }
  }
  
  return {
    productId: product.id.split('/').pop() || "",
    variantId: variantIdNumber,
    title: product.title,
    handle: product.handle,
    // publishablePublish dönüşündeki URL’yi tercih et, yoksa productSet’ten geleni kullan
    onlineStoreUrl: publishedProduct?.onlineStoreUrl || product.onlineStoreUrl,
    price: price
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
