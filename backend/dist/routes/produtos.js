import { Router } from 'express';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { TIPOS } from '../lib/tipos.js';
export const produtoRouter = Router();
const numeroOpcional = z.coerce.number().positive().optional().nullable();
const fotoOpcional = z.string().trim().max(4_200_000).optional().nullable();
const produtoSchema = z.object({
    descricao: z.string().trim().min(1, 'Descricao obrigatoria').max(100),
    tipo: z.enum(TIPOS),
    estado: z.enum(['NOVO', 'USADO']).default('NOVO'),
    preco: z.coerce.number().positive('O preco deve ser maior que 0'),
    comprimento: numeroOpcional,
    bitola: numeroOpcional,
    peso: numeroOpcional,
    quantidade: z.coerce.number().int().min(0).default(0),
    foto: fotoOpcional,
    utilizacoes: z.string().trim().optional().nullable(),
});
const produtoEdicaoSchema = produtoSchema
    .omit({ quantidade: true, estado: true })
    .extend({
    quantidade: z.coerce.number().int().min(0).optional(),
    estado: z.enum(['NOVO', 'USADO']).optional(),
});
const filtroSchema = z.object({
    id: z.coerce.number().int().min(1000).max(9999).optional(),
    tipo: z.enum(TIPOS).optional(),
    estado: z.enum(['NOVO', 'USADO']).optional(),
    busca: z.string().trim().optional(),
    bitola: z.coerce.number().optional(),
    comprimento: z.coerce.number().optional(),
    preco: z.coerce.number().optional(),
    peso: z.coerce.number().optional(),
    quantidade: z.coerce.number().int().min(0).optional(),
    incluirInativos: z.enum(['true', 'false']).optional(),
});
const recentesSchema = z.object({
    limite: z.coerce.number().int().min(1).max(20).default(6),
});
const ajusteSchema = z.object({
    delta: z.coerce
        .number()
        .int()
        .refine((n) => n !== 0, 'Informe um valor diferente de zero'),
});
const num = (value) => (value === null || value === undefined ? null : Number(value));
function serializa(produto) {
    return {
        ...produto,
        preco: Number(produto.preco),
        comprimento: num(produto.comprimento),
        bitola: num(produto.bitola),
        peso: num(produto.peso),
    };
}
function idValido(valor) {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}
produtoRouter.get('/', async (req, res) => {
    const filtros = filtroSchema.safeParse(req.query);
    if (!filtros.success) {
        return res.status(400).json({ erro: 'Filtros invalidos', detalhes: filtros.error.flatten() });
    }
    const { id, tipo, estado, busca, bitola, comprimento, preco, peso, quantidade, incluirInativos } = filtros.data;
    const produtos = await prisma.produto.findMany({
        where: {
            ativo: incluirInativos === 'true' ? undefined : true,
            codigo: id,
            tipo,
            estado,
            descricao: busca ? { contains: busca, mode: 'insensitive' } : undefined,
            bitola: bitola === undefined ? undefined : { equals: bitola },
            comprimento: comprimento === undefined ? undefined : { equals: comprimento },
            preco: preco === undefined ? undefined : { equals: preco },
            peso: peso === undefined ? undefined : { equals: peso },
            quantidade: quantidade === undefined ? undefined : { equals: quantidade },
        },
        orderBy: { descricao: 'asc' },
    });
    return res.json(produtos.map(serializa));
});
produtoRouter.get('/recentes', async (req, res) => {
    const parametros = recentesSchema.safeParse(req.query);
    if (!parametros.success) {
        return res.status(400).json({ erro: 'Limite inválido', detalhes: parametros.error.flatten() });
    }
    const produtos = await prisma.produto.findMany({
        where: { ativo: true },
        orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
        take: parametros.data.limite,
    });
    return res.json(produtos.map(serializa));
});
produtoRouter.get('/:id', async (req, res) => {
    const id = idValido(req.params.id);
    if (id === null)
        return res.status(400).json({ erro: 'ID invalido' });
    const produto = await prisma.produto.findFirst({ where: { id, ativo: true } });
    if (!produto)
        return res.status(404).json({ erro: 'Produto nao encontrado' });
    return res.json(serializa(produto));
});
produtoRouter.post('/', async (req, res) => {
    const dados = produtoSchema.safeParse(req.body);
    if (!dados.success) {
        return res.status(400).json({ erro: 'Dados invalidos', detalhes: dados.error.flatten() });
    }
    for (let tentativa = 0; tentativa < 10; tentativa += 1) {
        const codigosExistentes = await prisma.produto.findMany({
            select: { codigo: true },
        });
        if (codigosExistentes.length >= 9000) {
            return res.status(409).json({ erro: 'Todos os IDs de quatro dígitos já estão em uso' });
        }
        const codigosUsados = new Set(codigosExistentes.map((produto) => produto.codigo));
        const inicio = randomInt(1000, 10000);
        let codigo;
        for (let deslocamento = 0; deslocamento < 9000; deslocamento += 1) {
            const candidato = 1000 + ((inicio - 1000 + deslocamento) % 9000);
            if (!codigosUsados.has(candidato)) {
                codigo = candidato;
                break;
            }
        }
        if (codigo === undefined) {
            return res.status(409).json({ erro: 'Todos os IDs de quatro dígitos já estão em uso' });
        }
        try {
            const produto = await prisma.produto.create({
                data: { ...dados.data, codigo },
            });
            return res.status(201).json(serializa(produto));
        }
        catch (erro) {
            if (!(erro instanceof Prisma.PrismaClientKnownRequestError) ||
                erro.code !== 'P2002' ||
                !(erro.meta?.target === 'produto_codigo_key' ||
                    erro.meta?.target === 'codigo' ||
                    (Array.isArray(erro.meta?.target) && erro.meta.target.includes('codigo')))) {
                throw erro;
            }
        }
    }
    return res.status(503).json({ erro: 'Não foi possível gerar um ID único. Tente novamente.' });
});
produtoRouter.put('/:id', async (req, res) => {
    const id = idValido(req.params.id);
    if (id === null)
        return res.status(400).json({ erro: 'ID invalido' });
    const dados = produtoEdicaoSchema.safeParse(req.body);
    if (!dados.success) {
        return res.status(400).json({ erro: 'Dados invalidos', detalhes: dados.error.flatten() });
    }
    const resultado = await prisma.produto.updateMany({
        where: { id, ativo: true },
        data: dados.data,
    });
    if (resultado.count === 0)
        return res.status(404).json({ erro: 'Produto nao encontrado' });
    const produto = await prisma.produto.findUniqueOrThrow({ where: { id } });
    return res.json(serializa(produto));
});
produtoRouter.patch('/:id/estoque', async (req, res) => {
    const id = idValido(req.params.id);
    if (id === null)
        return res.status(400).json({ erro: 'ID invalido' });
    const ajuste = ajusteSchema.safeParse(req.body);
    if (!ajuste.success) {
        return res.status(400).json({ erro: 'Ajuste invalido', detalhes: ajuste.error.flatten() });
    }
    const { delta } = ajuste.data;
    const resultado = await prisma.produto.updateMany({
        where: {
            id,
            ativo: true,
            ...(delta < 0 ? { quantidade: { gte: -delta } } : {}),
        },
        data: { quantidade: { increment: delta } },
    });
    if (resultado.count === 0) {
        const existe = await prisma.produto.findFirst({ where: { id, ativo: true }, select: { id: true } });
        if (!existe)
            return res.status(404).json({ erro: 'Produto nao encontrado' });
        return res.status(409).json({ erro: 'Estoque insuficiente para esse ajuste' });
    }
    const produto = await prisma.produto.findUniqueOrThrow({ where: { id } });
    return res.json(serializa(produto));
});
produtoRouter.delete('/:id', async (req, res) => {
    const id = idValido(req.params.id);
    if (id === null)
        return res.status(400).json({ erro: 'ID invalido' });
    const resultado = await prisma.produto.updateMany({
        where: { id, ativo: true },
        data: { ativo: false },
    });
    if (resultado.count === 0)
        return res.status(404).json({ erro: 'Produto nao encontrado' });
    return res.status(204).send();
});
