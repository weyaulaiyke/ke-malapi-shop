-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "products"
ADD CONSTRAINT "products_price_check"
CHECK ("price" >= 0);
