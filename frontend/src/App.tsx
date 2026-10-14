import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './app/page'
import CategoriasPage from './app/categorias/page'
import ProdutosPorTipo from './app/produtos/[tipo]/page'
import { TIPOS } from './lib/tipos'

function AppLayout() {
  const location = useLocation()
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const botaoMenu = useRef<HTMLButtonElement>(null)
  const botaoFecharMenu = useRef<HTMLButtonElement>(null)
  const menuAberto = menuPath === location.pathname

  useEffect(() => {
    if (!menuAberto) return
    botaoFecharMenu.current?.focus()

    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setMenuPath(null)
        botaoMenu.current?.focus()
      }
    }

    window.addEventListener('keydown', fecharComEscape)
    return () => window.removeEventListener('keydown', fecharComEscape)
  }, [menuAberto])

  const linkInicioAtivo = location.pathname === '/'
  const linkCategoriasAtivo = location.pathname === '/categorias'

  return (
    <div className="app-layout">
      {menuAberto && (
        <button
          ref={botaoFecharMenu}
          type="button"
          className="sidebar-backdrop"
          aria-label="Fechar menu de navegação"
          onClick={() => setMenuPath(null)}
        />
      )}

      <aside className={`sidebar${menuAberto ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">CF</span>
          <div>
            <span className="sidebar-brand-name">ClasseCards</span>
            <span className="sidebar-brand-caption">Catálogo de produtos</span>
          </div>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Fechar menu de navegação"
            onClick={() => setMenuPath(null)}
          >
            ×
          </button>
        </div>

        <nav id="main-navigation" className="sidebar-nav" aria-label="Navegação principal">
          <span className="sidebar-section-label">MENU</span>
          <Link
            to="/categorias"
            className={`sidebar-link${linkCategoriasAtivo ? ' sidebar-link-active' : ''}`}
            aria-current={linkCategoriasAtivo ? 'page' : undefined}
            onClick={() => setMenuPath(null)}
          >
            <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="8" height="8" rx="1.5" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" />
            </svg>
            <span>Categorias</span>
          </Link>
          <Link
            to="/"
            className={`sidebar-link${linkInicioAtivo ? ' sidebar-link-active' : ''}`}
            aria-current={linkInicioAtivo ? 'page' : undefined}
            onClick={() => setMenuPath(null)}
          >
            <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" />
            </svg>
            <span>Visão geral</span>
          </Link>

          <span className="sidebar-section-label sidebar-categories-label">CATEGORIAS</span>
          {TIPOS.map((tipo) => {
            const ativo = location.pathname === `/produtos/${tipo.slug}`
            return (
              <Link
                key={tipo.valor}
                to={`/produtos/${tipo.slug}`}
                className={`sidebar-link sidebar-category-link${ativo ? ' sidebar-link-active' : ''}`}
                aria-current={ativo ? 'page' : undefined}
                onClick={() => setMenuPath(null)}
              >
                <span
                  className="sidebar-category-dot"
                  style={{ backgroundColor: tipo.color }}
                  aria-hidden="true"
                />
                <span>{tipo.rotulo}</span>
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-footer">Navegue pelo seu catálogo</div>
      </aside>

      <div className="app-main">
        <header className="mobile-header">
          <button
            ref={botaoMenu}
            type="button"
            className="mobile-menu-button"
            aria-label="Abrir menu de navegação"
            aria-expanded={menuAberto}
            aria-controls="main-navigation"
            onClick={() => setMenuPath(location.pathname)}
          >
            <span className="menu-button-lines" aria-hidden="true"><i /><i /><i /></span>
            <span>Menu</span>
          </button>
          <span className="mobile-brand">ClasseCards</span>
        </header>
        <div className="routes-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/categorias" element={<CategoriasPage />} />
            <Route path="/produtos/:tipo" element={<ProdutosPorTipo />} />
            <Route
              path="*"
              element={
                <main className="page-shell">
                  <p>Página não encontrada.</p>
                  <Link to="/" className="back-link">
                    Voltar ao catálogo
                  </Link>
                </main>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
