import type { TipoProduto } from './tipos'

const API = (
    import.meta.env.VITE_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:3333`
).replace(/\/$/, '')

export type Produto = {
    id: number
    codigo: number
    descricao: string
    tipo: TipoProduto
    estado: EstadoProduto
    preco: number
    comprimento: number | null
    bitola: number | null
    peso: number | null
    quantidade: number
    foto: string | null
    utilizacoes: string | null
    criadoEm: string
}

export type EstadoProduto = 'NOVO' | 'USADO'

export type DadosProduto = Omit<Produto, 'id' | 'codigo' | 'criadoEm'>

export type ResumoTipo = { tipo: string; produtos: number; unidades: number }
export type Resumo = { totalProdutos: number; totalUnidades: number}

export type Filtros = { 
    id?: string;
    tipo?: TipoProduto;
    estado?: EstadoProduto;
    busca?: string;
    bitola?: string;
    comprimento?: string;
    preco?: string;
    peso?: string;
    quantidade?: string;
}

const CAMPOS_NUMERICOS = ["bitola", "comprimento", "preco", "peso", "quantidade"];

export async function listarTipos(): Promise<ResumoTipo[]>{
    const res = await fetch(`${API}/tipos`, { cache: 'no-store'})
    if (!res.ok) throw new Error('Erro ao carregar os tipos')
    return res.json()
}

export async function listarProdutos(
    filtros: Filtros,
): Promise<{ produtos: Produto[], resumo: Resumo }> {
    const params = new URLSearchParams()

    for (const [chave, valor] of Object.entries(filtros)) {
        const v = valor?.trim()
        if (!v) continue
        params.set(chave, CAMPOS_NUMERICOS.includes(chave) ? v.replace(',', '.') : v)
    }

    const query = params.toString()
    const res = await fetch(`${API}/produtos${query ? `?${query}` : ''}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Erro ao buscar produtos')
    const produtos = (await res.json()) as Produto[]
    const resumo = produtos.reduce(
        (total, produto) => ({
            totalProdutos: total.totalProdutos + 1,
            totalUnidades: total.totalUnidades + produto.quantidade,
        }),
        { totalProdutos: 0, totalUnidades: 0 },
    )

    return { produtos, resumo }
}

export async function listarProdutosRecentes(limite = 6): Promise<Produto[]> {
    const params = new URLSearchParams({ limite: String(limite) })
    const res = await fetch(`${API}/produtos/recentes?${params}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Não foi possível carregar os produtos recentes')
    return res.json()
}

async function erroDaResposta(res: Response, padrao: string) {
    if (res.ok) return
    const dados = await res.json().catch(() => null) as { erro?: string } | null
    throw new Error(dados?.erro ?? padrao)
}

export async function criarProduto(dados: DadosProduto): Promise<Produto> {
    const res = await fetch(`${API}/produtos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
    })
    await erroDaResposta(res, 'Não foi possível cadastrar o produto')
    return res.json()
}

export async function atualizarProduto(id: number, dados: DadosProduto): Promise<Produto> {
    const res = await fetch(`${API}/produtos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
    })
    await erroDaResposta(res, 'Não foi possível atualizar o produto')
    return res.json()
}

export async function excluirProduto(id: number): Promise<void> {
    const res = await fetch(`${API}/produtos/${id}`, { method: 'DELETE' })
    await erroDaResposta(res, 'Não foi possível excluir o produto')
}