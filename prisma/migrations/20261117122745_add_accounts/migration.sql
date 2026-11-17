-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
