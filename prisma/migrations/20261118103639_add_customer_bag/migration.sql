-- CreateTable
CREATE TABLE "bag_items" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_size_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bag_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bag_items_product_size_id_idx" ON "bag_items"("product_size_id");

-- CreateIndex
CREATE UNIQUE INDEX "bag_items_customer_id_product_size_id_key" ON "bag_items"("customer_id", "product_size_id");

-- AddForeignKey
ALTER TABLE "bag_items" ADD CONSTRAINT "bag_items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bag_items" ADD CONSTRAINT "bag_items_product_size_id_fkey" FOREIGN KEY ("product_size_id") REFERENCES "product_sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
