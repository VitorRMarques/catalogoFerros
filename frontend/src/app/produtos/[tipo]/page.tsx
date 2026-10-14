import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { atualizarProduto, criarProduto, excluirProduto, listarProdutos } from '../../../lib/api';
import type { DadosProduto, EstadoProduto, Produto, Resumo } from '../../../lib/api';
import { porSlug, TIPOS, type TipoProduto } from '../../../lib/tipos';

const CAMPOS = [
  { chave: 'id', rotulo: 'ID', placeholder: 'Ex.: 4821' },
  { chave: 'busca', rotulo: 'Descrição', placeholder: 'Ex.: cantoneira galvanizada' },
  { chave: 'bitola', rotulo: 'Bitola (mm)', placeholder: 'Ex.: 10' },
  { chave: 'comprimento', rotulo: 'Comprimento (m)', placeholder: 'Ex.: 12' },
  { chave: 'preco', rotulo: 'Preço (R$)', placeholder: 'Ex.: 125,50' },
  { chave: 'peso', rotulo: 'Peso (kg)', placeholder: 'Ex.: 25,5' },
  { chave: 'quantidade', rotulo: 'Quantidade', placeholder: 'Ex.: 10' },
  { chave: 'estado', rotulo: 'Estado', placeholder: 'Selecione o estado' },
] as const;

type ChaveFiltro = (typeof CAMPOS)[number]['chave'];

type FiltrosPesquisa = {
  id: string;
  busca: string;
  bitola: string;
  comprimento: string;
  preco: string;
  peso: string;
  quantidade: string;
  estado?: EstadoProduto;
};

const filtrosVazios: FiltrosPesquisa = {
  id: '',
  busca: '',
  bitola: '',
  comprimento: '',
  preco: '',
  peso: '',
  quantidade: '',
};

type FormularioProduto = {
  tipo: TipoProduto;
  descricao: string;
  estado: EstadoProduto;
  preco: string;
  comprimento: string;
  bitola: string;
  peso: string;
  quantidade: string;
  foto: string;
  utilizacoes: string;
};

const formularioVazio: FormularioProduto = {
  tipo: TIPOS[0].valor,
  descricao: '',
  estado: 'NOVO',
  preco: '',
  comprimento: '',
  bitola: '',
  peso: '',
  quantidade: '0',
  foto: '',
  utilizacoes: '',
};

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numero = (n: number | null) =>
  n === null ? '—' : n.toLocaleString('pt-BR');

const numeroOpcional = (valor: string) =>
  valor.trim() ? Number(valor.replace(',', '.')) : null;

const TIPOS_IMAGEM_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO_FOTO = 3 * 1024 * 1024;

function ehEstadoProduto(valor: string): valor is EstadoProduto {
  return valor === 'NOVO' || valor === 'USADO';
}

function ehTipoProduto(valor: string): valor is TipoProduto {
  return TIPOS.some((item) => item.valor === valor);
}

export default function ProdutosPorTipo() {
  const { tipo: slug } = useParams();
  const tipo = porSlug(slug ?? '');
  const navigate = useNavigate();

  const [campoPesquisa, setCampoPesquisa] = useState<ChaveFiltro>('busca');
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [filtros, setFiltros] = useState<FiltrosPesquisa>(filtrosVazios);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [resumo, setResumo] = useState<Resumo>({
    totalProdutos: 0,
    totalUnidades: 0,
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<number | null>(null);
  const [formulario, setFormulario] = useState(formularioVazio);
  const [salvando, setSalvando] = useState(false);
  const campoSelecionado = CAMPOS.find((campo) => campo.chave === campoPesquisa);

  // Busca com pequeno atraso para não chamar a API a cada tecla
  useEffect(() => {
    if (!tipo) return;

    const t = setTimeout(async () => {
      setCarregando(true);
      try {
        const dados = await listarProdutos({ ...filtros, tipo: tipo.valor });
        setProdutos(dados.produtos);
        setResumo(dados.resumo);
        setErro('');
      } catch (e) {
        setErro((e as Error).message);
      } finally {
        setCarregando(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [filtros, tipo, atualizacao]);

  function abrirCadastro() {
    setIdEdicao(null);
    setFormulario({ ...formularioVazio, tipo: tipo?.valor ?? TIPOS[0].valor });
    setErro('');
    setFormularioAberto(true);
  }

  function abrirEdicao(produto: Produto) {
    setIdEdicao(produto.id);
    setFormulario({
      tipo: produto.tipo,
      descricao: produto.descricao,
      estado: produto.estado,
      preco: String(produto.preco),
      comprimento: produto.comprimento === null ? '' : String(produto.comprimento),
      bitola: produto.bitola === null ? '' : String(produto.bitola),
      peso: produto.peso === null ? '' : String(produto.peso),
      quantidade: String(produto.quantidade),
      foto: produto.foto ?? '',
      utilizacoes: produto.utilizacoes ?? '',
    });
    setErro('');
    setFormularioAberto(true);
  }

  function fecharFormulario() {
    setFormularioAberto(false);
    setIdEdicao(null);
    setFormulario(formularioVazio);
  }

  async function salvarProduto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!tipo) return;

    const tipoSelecionado = TIPOS.find((item) => item.valor === formulario.tipo);
    if (!tipoSelecionado) {
      setErro('Selecione uma categoria válida.');
      return;
    }

    const dados: DadosProduto = {
      tipo: formulario.tipo,
      descricao: formulario.descricao.trim(),
      estado: formulario.estado,
      preco: Number(formulario.preco.replace(',', '.')),
      comprimento: numeroOpcional(formulario.comprimento),
      bitola: numeroOpcional(formulario.bitola),
      peso: numeroOpcional(formulario.peso),
      quantidade: Number(formulario.quantidade),
      foto: formulario.foto.trim() || null,
      utilizacoes: formulario.utilizacoes.trim() || null,
    };

    setSalvando(true);
    setErro('');
    try {
      if (idEdicao === null) {
        await criarProduto(dados);
      } else {
        await atualizarProduto(idEdicao, dados);
      }
      fecharFormulario();
      if (tipoSelecionado.slug !== slug) {
        navigate(`/produtos/${tipoSelecionado.slug}`);
      } else {
        setAtualizacao((valor) => valor + 1);
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function removerProduto(produto: Produto) {
    if (!window.confirm(`Excluir "${produto.descricao}" do catálogo?`)) return;

    setErro('');
    try {
      await excluirProduto(produto.id);
      setAtualizacao((valor) => valor + 1);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  function alterarCampo(campo: keyof FormularioProduto, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function alterarCategoria(valor: string) {
    if (ehTipoProduto(valor)) {
      alterarCampo('tipo', valor);
    } else {
      setErro('Selecione uma categoria válida.');
    }
  }

  function selecionarFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.currentTarget.files?.[0];
    evento.currentTarget.value = '';
    if (!arquivo) return;

    if (!TIPOS_IMAGEM_ACEITOS.includes(arquivo.type)) {
      setErro('A foto deve estar no formato JPG, PNG ou WebP.');
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      setErro('A foto deve ter no máximo 3 MB.');
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      if (typeof leitor.result !== 'string') {
        setErro('Não foi possível carregar a foto selecionada.');
        return;
      }
      setErro('');
      alterarCampo('foto', leitor.result);
    };
    leitor.onerror = () => setErro('Não foi possível ler a foto selecionada.');
    leitor.readAsDataURL(arquivo);
  }

  function pesquisar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (campoPesquisa === 'estado') {
      if (!ehEstadoProduto(termoPesquisa)) {
        setErro('Selecione um estado válido.');
        return;
      }
      setFiltros({ ...filtrosVazios, estado: termoPesquisa });
      return;
    }

    setFiltros({ ...filtrosVazios, [campoPesquisa]: termoPesquisa.trim() });
  }

  function limparPesquisa() {
    setTermoPesquisa('');
    setFiltros(filtrosVazios);
  }

  if (!tipo) {
    return (
      <main className="page-shell">
        <p>Tipo não encontrado.</p>
        <Link to="/" className="back-link">
          Voltar
        </Link>
      </main>
    );
  }

  return (
    <main className="page-shell products-page">
      <header className="products-heading">
        <Link to="/" className="back-link">
          ← Todos os tipos
        </Link>
        <h1 className="page-title">{tipo.rotulo}</h1>
      </header>

      <form className="search-form" onSubmit={pesquisar}>
        <label className="filter-field">
          Pesquisar por
          <select
            value={campoPesquisa}
            onChange={(evento) => {
              const campo = CAMPOS.find((opcao) => opcao.chave === evento.target.value);
              if (!campo) {
                setErro('Selecione um campo de pesquisa válido.');
                return;
              }
              setErro('');
              setCampoPesquisa(campo.chave);
              setTermoPesquisa('');
            }}
            className="filter-input"
          >
            {CAMPOS.map((campo) => (
              <option key={campo.chave} value={campo.chave}>
                {campo.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          {campoSelecionado?.rotulo}
          {campoPesquisa === 'estado' ? (
            <select
              required
              value={termoPesquisa}
              onChange={(evento) => setTermoPesquisa(evento.target.value)}
              className="filter-input"
            >
              <option value="">Selecione o estado</option>
              <option value="NOVO">Novo</option>
              <option value="USADO">Usado</option>
            </select>
          ) : (
            <input
              type={campoPesquisa === 'busca' ? 'search' : 'text'}
              required
              pattern={campoPesquisa === 'busca' ? undefined : campoPesquisa === 'id' || campoPesquisa === 'quantidade' ? '[0-9]+' : '[0-9]+([.,][0-9]+)?'}
              inputMode={campoPesquisa === 'busca' ? undefined : campoPesquisa === 'id' || campoPesquisa === 'quantidade' ? 'numeric' : 'decimal'}
              value={termoPesquisa}
              onChange={(evento) => setTermoPesquisa(evento.target.value)}
              placeholder={campoSelecionado?.placeholder}
              className="filter-input"
            />
          )}
        </label>
        <div className="search-actions">
          <button type="submit" className="button-primary" disabled={!termoPesquisa.trim()}>
            Pesquisar
          </button>
        </div>
      </form>

      {formularioAberto && (
        <section className="product-form" aria-labelledby="product-form-title">
          <div className="form-heading">
            <h2 id="product-form-title" className="form-title">
              {idEdicao === null ? 'Cadastrar produto' : 'Editar produto'}
            </h2>
            <button type="button" className="form-cancel" onClick={fecharFormulario}>
              Cancelar
            </button>
          </div>
          <form onSubmit={salvarProduto}>
            <div className="form-grid">
              <label className="form-field">
                Categoria
                <select
                  required
                  value={formulario.tipo}
                  onChange={(evento) => alterarCategoria(evento.target.value)}
                  className="filter-input"
                >
                  {TIPOS.map((item) => (
                    <option key={item.valor} value={item.valor}>
                      {item.rotulo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field form-field-wide">
                Descrição
                <input
                  required
                  maxLength={100}
                  value={formulario.descricao}
                  onChange={(evento) => alterarCampo('descricao', evento.target.value)}
                  className="filter-input"
                />
              </label>
              <label className="form-field">
                Estado
                <select
                  required
                  value={formulario.estado}
                  onChange={(evento) => {
                    if (ehEstadoProduto(evento.target.value)) {
                      alterarCampo('estado', evento.target.value);
                    }
                  }}
                  className="filter-input"
                >
                  <option value="NOVO">Novo</option>
                  <option value="USADO">Usado</option>
                </select>
              </label>
              <label className="form-field">
                Bitola (mm)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={formulario.bitola}
                  onChange={(evento) => alterarCampo('bitola', evento.target.value)}
                  className="filter-input"
                />
              </label>
              <label className="form-field">
                Comprimento (m)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={formulario.comprimento}
                  onChange={(evento) => alterarCampo('comprimento', evento.target.value)}
                  className="filter-input"
                />
              </label>
              <label className="form-field">
                Preço (R$)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={formulario.preco}
                  onChange={(evento) => alterarCampo('preco', evento.target.value)}
                  className="filter-input"
                />
              </label>
              <label className="form-field">
                Quantidade
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={formulario.quantidade}
                  onChange={(evento) => alterarCampo('quantidade', evento.target.value)}
                  className="filter-input"
                />
              </label>
              <label className="form-field">
                Peso (kg)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={formulario.peso}
                  onChange={(evento) => alterarCampo('peso', evento.target.value)}
                  className="filter-input"
                />
              </label>
              <div className="form-field form-field-wide">
                <label htmlFor="product-photo">Foto do produto</label>
                <input
                  id="product-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selecionarFoto}
                  className="filter-input photo-input"
                />
                <span className="photo-help">JPG, PNG ou WebP; máximo de 3 MB.</span>
                {formulario.foto && (
                  <div className="photo-preview">
                    <img src={formulario.foto} alt="Prévia da foto do produto" />
                    <button
                      type="button"
                      className="form-cancel"
                      onClick={() => alterarCampo('foto', '')}
                    >
                      Remover foto
                    </button>
                  </div>
                )}
              </div>
              <label className="form-field form-field-wide">
                Correspondências / utilizações
                <textarea
                  rows={3}
                  value={formulario.utilizacoes}
                  onChange={(evento) => alterarCampo('utilizacoes', evento.target.value)}
                  className="filter-input form-textarea"
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="button-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar produto'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="results-summary">
        <p className="results-count">
          {resumo.totalProdutos} produtos · {resumo.totalUnidades} unidades em
          estoque
        </p>
        <div className="results-actions">
          <button
            type="button"
            onClick={limparPesquisa}
            className="clear-filters"
          >
            Limpar pesquisa
          </button>
          <button type="button" onClick={abrirCadastro} className="button-primary">
            + Novo produto
          </button>
        </div>
      </div>

      {erro && <p className="status-error">{erro}</p>}

      <div className="table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Foto</th>
              <th>Descrição</th>
              <th>Estado</th>
              <th>Bitola (mm)</th>
              <th>Compr. (m)</th>
              <th>Peso (kg)</th>
              <th>Preço (R$)/ Peso (Kg)</th>
              <th>Estoque</th>
              <th>Correspondências</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {produtos.map((p) => (
              <tr key={p.id}>
                <td data-label="ID">
                  <span className="product-code">{p.codigo}</span>
                </td>
                <td data-label="Foto">
                  {p.foto ? (
                    <img className="product-thumbnail" src={p.foto} alt={`Foto de ${p.descricao}`} />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="product-description" data-label="Descrição">{p.descricao}</td>
                <td data-label="Estado">
                  <span className={`product-state product-state-${p.estado.toLowerCase()}`}>
                    {p.estado === 'NOVO' ? 'Novo' : 'Usado'}
                  </span>
                </td>
                <td data-label="Bitola (mm)">{numero(p.bitola)}</td>
                <td data-label="Comprimento (m)">{numero(p.comprimento)}</td>
                <td data-label="Peso (kg)">{numero(p.peso)}</td>
                <td className="product-price" data-label="Preço">{moeda.format(p.preco)}</td>
                <td data-label="Estoque">{p.quantidade}</td>
                <td className="product-correspondences" data-label="Correspondências">
                  {p.utilizacoes || '—'}
                </td>
                <td data-label="Ações" className="table-actions">
                  <button type="button" onClick={() => abrirEdicao(p)} aria-label={`Editar ${p.descricao}`}>
                    Editar
                  </button>
                  <button type="button" onClick={() => removerProduto(p)} aria-label={`Excluir ${p.descricao}`}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {!carregando && produtos.length === 0 && (
              <tr>
                <td colSpan={11} className="empty-results">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}