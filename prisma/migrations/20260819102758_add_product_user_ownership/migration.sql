-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "price" REAL NOT NULL,
    "stock" INTEGER NOT NULL,
    "lowStockLimit" INTEGER NOT NULL DEFAULT 5,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("category", "createdAt", "id", "leadTimeDays", "lowStockLimit", "name", "price", "stock", "updatedAt") SELECT "category", "createdAt", "id", "leadTimeDays", "lowStockLimit", "name", "price", "stock", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_userId_idx" ON "Product"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
