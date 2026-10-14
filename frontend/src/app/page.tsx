'use client';
import  { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { listarProdutosRecentes, listarTipos } from '../lib/api';
import type { Produto, ResumoTipo } from '../lib/api';
import { TIPOS } from '../lib/tipos';

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export default function Home() {
  const [totais, setTotais] = useState<ResumoTipo[]>([]);
  const [recentes, setRecentes] = useState<Produto[]>([]);
  const [erro, setErro] = useState(false);
  const [erroRecentes, setErroRecentes] = useState(false);
  const [carregandoRecentes, setCarregandoRecentes] = useState(true);

  useEffect(() => {
    let ativo = true;
    listarTipos()
      .then((dados) => {
        if (ativo) setTotais(dados);
      })
      .catch(() => {
        if (ativo) setErro(true);
      });

      listarProdutosRecentes()
        .then((dados) => {
          if (ativo) setRecentes(dados);
        })
        .catch(() => {
          if (ativo) setErroRecentes(true);
        })
        .finally(() => {
          if (ativo) setCarregandoRecentes(false);
        });

      return () => {
        ativo = false;
    };
  }, []);

  return (
    <main className="page-shell">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">PAINEL DO CATÁLOGO</p>
          <h1 className="dashboard-title">Visão geral</h1>
          <p className="dashboard-subtitle">Acompanhe os itens adicionados recentemente ao catálogo.</p>
        </div>
        <div className="dashboard-count">
          <span>{totais.reduce((total, tipo) => total + tipo.produtos, 0)}</span>
          <span>produtos ativos</span>
        </div>
      </header>

      {erro && (
        <p className="status-error">
          Não foi possível carregar os totais. Verifique se a API está rodando.
        </p>
      )}

      <section className="dashboard-section" aria-labelledby="recent-products-title">
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-eyebrow">ATIVIDADE DO CATÁLOGO</p>
            <h2 id="recent-products-title" className="dashboard-section-title">Adicionados recentemente</h2>
          </div>
          <span className="dashboard-section-note">Últimos 6 produtos</span>
        </div>

        {erroRecentes && (
          <p className="status-error">
            Não foi possível carregar os produtos recentes. Verifique se a API está rodando.
          </p>
        )}

        {carregandoRecentes ? (
          <p className="dashboard-message" role="status">Carregando produtos recentes...</p>
        ) : !erroRecentes && recentes.length === 0 ? (
          <p className="dashboard-message">Ainda não há produtos cadastrados.</p>
        ) : (
          <div className="recent-products-grid">
            {recentes.map((produto) => {
              const tipo = TIPOS.find((item) => item.valor === produto.tipo);
              if (!tipo) return null;

              return (
                <article key={produto.id} className="recent-product-card">
                  <Link
                    to={`/produtos/${tipo.slug}`}
                    className="recent-product-image"
                    aria-label={`Abrir categoria ${tipo.rotulo}`}
                  >
                    {produto.foto ? (
                      <img src={produto.foto} alt={produto.descricao} />
                    ) : (
                      <span aria-hidden="true">{produto.descricao.charAt(0).toUpperCase()}</span>
                    )}
                  </Link>
                  <div className="recent-product-info">
                    <div className="recent-product-meta">
                      <span className="recent-product-code">#{produto.codigo}</span>
                      <span className={`product-state product-state-${produto.estado.toLowerCase()}`}>
                        {produto.estado === 'NOVO' ? 'Novo' : 'Usado'}
                      </span>
                    </div>
                    <Link to={`/produtos/${tipo.slug}`} className="recent-product-name">
                      {produto.descricao}
                    </Link>
                    <span className="recent-product-category">{tipo.rotulo}</span>
                    <div className="recent-product-footer">
                      <span className="recent-product-price">{moeda.format(produto.preco)}</span>
                      <time dateTime={produto.criadoEm}>
                        {dataHora.format(new Date(produto.criadoEm))}
                      </time>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}