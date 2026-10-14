import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TipoImagem from '../../components/TipoImagem';
import { listarTipos } from '../../lib/api';
import type { ResumoTipo } from '../../lib/api';
import { TIPOS } from '../../lib/tipos';

export default function Categorias() {
  const [totais, setTotais] = useState<ResumoTipo[]>([]);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    listarTipos()
      .then((dados) => {
        if (ativo) setTotais(dados);
      })
      .catch(() => {
        if (ativo) setErro(true);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const porTipo = new Map(totais.map((total) => [total.tipo, total]));

  return (
    <main className="page-shell">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">EXPLORE O ESTOQUE</p>
          <h1 className="dashboard-title">Categorias</h1>
          <p className="dashboard-subtitle">Consulte o estoque e os produtos de cada categoria.</p>
        </div>
      </header>

      {erro && (
        <p className="status-error">
          Não foi possível carregar os totais. Verifique se a API está rodando.
        </p>
      )}

      <div className="category-grid">
        {TIPOS.map((tipo) => {
          const total = porTipo.get(tipo.valor);
          return (
            <Link
              key={tipo.valor}
              to={`/produtos/${tipo.slug}`}
              className="category-card"
              style={{ borderTop: `5px solid ${tipo.color}` }}
            >
              <div className="category-image">
                <TipoImagem slug={tipo.slug} alt={tipo.rotulo} />
              </div>
              <div className="category-info">
                <p className="category-name">{tipo.rotulo}</p>
                <p className="category-total">
                  {total ? `${total.produtos} produtos · ${total.unidades} un.` : '—'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
