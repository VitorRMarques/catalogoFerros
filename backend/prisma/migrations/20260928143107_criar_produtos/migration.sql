-- CreateEnum
CREATE TYPE "Tipo" AS ENUM ('CANTONEIRA', 'VIGAU', 'VIGAI', 'METALON', 'CANO', 'CHAPA', 'FERROOBRA', 'TELHA', 'BORRACHA', 'INOX');

-- CreateTable
CREATE TABLE "produto" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(100) NOT NULL,
    "tipo" "Tipo" NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "comprimento" DECIMAL(10,2),
    "bitola" DECIMAL(10,2),
    "peso" DECIMAL(10,2),
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "foto" TEXT,
    "utilizacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "produto_tipo_bitola_idx" ON "produto"("tipo", "bitola");

-- CreateIndex
CREATE INDEX "produto_descricao_idx" ON "produto"("descricao");
