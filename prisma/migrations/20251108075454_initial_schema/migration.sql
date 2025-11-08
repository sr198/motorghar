/*
  Warnings:

  - You are about to drop the column `media` on the `vehicle_catalog` table. All the data in the column will be lost.
  - You are about to drop the `vehicle_variant` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `trim` on table `vehicle_catalog` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "vehicle_variant" DROP CONSTRAINT "vehicle_variant_catalog_id_fkey";

-- AlterTable
ALTER TABLE "vehicle_catalog" DROP COLUMN "media",
ALTER COLUMN "trim" SET NOT NULL;

-- DropTable
DROP TABLE "vehicle_variant";

-- CreateTable
CREATE TABLE "vehicle_catalog_media" (
    "id" UUID NOT NULL,
    "catalog_id" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "kind" VARCHAR(50) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_catalog_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_catalog_media_catalog_id_idx" ON "vehicle_catalog_media"("catalog_id");

-- CreateIndex
CREATE INDEX "vehicle_catalog_media_catalog_id_order_idx" ON "vehicle_catalog_media"("catalog_id", "order");

-- AddForeignKey
ALTER TABLE "vehicle_catalog_media" ADD CONSTRAINT "vehicle_catalog_media_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "vehicle_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
