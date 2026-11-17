-- CreateTable
CREATE TABLE "product_sizes" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "size" VARCHAR(30) NOT NULL,

    CONSTRAINT "product_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_sizes_product_id_size_key" ON "product_sizes"("product_id", "size");

-- AddForeignKey
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
