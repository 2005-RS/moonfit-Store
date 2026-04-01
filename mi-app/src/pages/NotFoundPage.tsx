import { Link } from 'react-router-dom'
import PageIntro from '../components/shared/PageIntro'

function NotFoundPage() {
  return (
    <main className="page-shell">
      <PageIntro
        eyebrow="404"
        title="La pagina que buscas no esta disponible"
        description="Puedes volver al inicio o seguir explorando el catalogo Moonfit."
      />
      <div className="hero-actions">
        <Link to="/" className="primary-link">
          Volver al inicio
        </Link>
        <Link to="/catalogo" className="secondary-link">
          Ir al catalogo
        </Link>
      </div>
    </main>
  )
}

export default NotFoundPage
