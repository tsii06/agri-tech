-- CreateTable
CREATE TABLE "Ancrage" (
    "id" SERIAL NOT NULL,
    "txHash" TEXT NOT NULL,
    "refExpedition" TEXT NOT NULL,

    CONSTRAINT "Ancrage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ancrage_txHash_key" ON "Ancrage"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Ancrage_refExpedition_key" ON "Ancrage"("refExpedition");
