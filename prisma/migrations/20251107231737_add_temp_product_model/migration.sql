-- CreateTable
CREATE TABLE "TempProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "material" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleteAt" DATETIME NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "TempProduct_shop_deleted_idx" ON "TempProduct"("shop", "deleted");

-- CreateIndex
CREATE INDEX "TempProduct_deleteAt_deleted_idx" ON "TempProduct"("deleteAt", "deleted");
