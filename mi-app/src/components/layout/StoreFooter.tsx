import { Link } from 'react-router-dom'
import MoonfitBrand from '../branding/MoonfitBrand'

const footerColumns = [
  {
    title: 'Explora',
    links: [
      { to: '/catalogo', label: 'Catalogo completo' },
      { to: '/carrito', label: 'Tu seleccion' },
      { to: '/cuenta', label: 'Mi cuenta' },
    ],
  },
  {
    title: 'Colecciones',
    links: [
      { to: '/#performance-lab', label: 'Buscar por objetivo' },
      { to: '/#stacks-combos', label: 'Selecciones' },
      { to: '/#ofertas-del-mes', label: 'Ofertas del mes' },
    ],
  },
]

function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="store-footer-grid">
        <div className="store-footer-brand">
          <MoonfitBrand theme="light" className="store-footer-brand-lockup" />
          <h2>Entrenamiento, bienestar y accesorios presentados con una mirada mas serena.</h2>
          <p>
            Moonfit une descubrimiento, asesoria y compra en una experiencia
            limpia, cercana y atemporal.
          </p>

          <div className="store-footer-badge-row">
            <span className="store-footer-badge">Esenciales</span>
            <span className="store-footer-badge">Bienestar</span>
            <span className="store-footer-badge">Movimiento</span>
          </div>

          <Link to="/admin/login" className="store-footer-admin-link">
            Acceso de operadores
          </Link>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title} className="store-footer-column">
            <h3>{column.title}</h3>
            <div className="store-footer-links">
              {column.links.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="store-footer-card store-footer-contact-card">
          <span>Asesoria Moonfit</span>
          <strong>Una conversacion cercana para elegir con mas claridad y confianza.</strong>
          <p>
            Un canal simple para acompanarte cuando quieras comparar opciones o
            recibir una recomendacion mas guiada.
          </p>

          <div className="store-footer-contact-meta">
            <small>WhatsApp directo</small>
            <small>Entrega coordinada</small>
          </div>

          <a
            href="https://wa.me/50600000000?text=Hola%2C%20quiero%20asesoria%20para%20comprar"
            target="_blank"
            rel="noreferrer"
            className="store-footer-whatsapp"
          >
            Hablar por WhatsApp
          </a>
        </div>
      </div>
    </footer>
  )
}

export default StoreFooter
