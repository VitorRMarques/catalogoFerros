import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { TIPOS } from "../lib/tipos.js";
export const tiposRouter = Router();
tiposRouter.get("/", async (_req, res) => {
    const grupos = await prisma.produto.groupBy({
        by: ['tipo'],
        where: { ativo: true },
        _count: { _all: true },
        _sum: { quantidade: true },
    });
    const porTipo = new Map(grupos.map((g) => [g.tipo, g]));
    res.json(TIPOS.map((tipo) => ({
        tipo,
        produtos: porTipo.get(tipo)?._count._all ?? 0,
        unidades: porTipo.get(tipo)?._sum.quantidade ?? 0,
    })));
});
