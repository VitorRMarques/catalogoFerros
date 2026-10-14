DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "produto") > 9000 THEN
    RAISE EXCEPTION 'Nao e possivel atribuir codigos unicos de quatro digitos a mais de 9000 produtos';
  END IF;
END $$;

ALTER TABLE "produto" ADD COLUMN "codigo" INTEGER;

DO $$
DECLARE
  produto_atual RECORD;
  codigo_aleatorio INTEGER;
BEGIN
  FOR produto_atual IN SELECT "id" FROM "produto" ORDER BY "id" LOOP
    LOOP
      codigo_aleatorio := floor(random() * 9000)::INTEGER + 1000;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM "produto" WHERE "codigo" = codigo_aleatorio
      );
    END LOOP;

    UPDATE "produto"
    SET "codigo" = codigo_aleatorio
    WHERE "id" = produto_atual."id";
  END LOOP;
END $$;

ALTER TABLE "produto" ALTER COLUMN "codigo" SET NOT NULL;
CREATE UNIQUE INDEX "produto_codigo_key" ON "produto"("codigo");
