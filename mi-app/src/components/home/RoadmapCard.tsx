import { Link } from 'react-router-dom'

function RoadmapCard() {
  return (
    <aside className="roadmap-card">
      <p className="eyebrow">Atajos comerciales</p>
      <h3>Activa rapido los puntos que mas ayudan a convertir</h3>
      <p className="roadmap-card-copy">
        Catalogo, carrito, cuenta y WhatsApp quedan a un clic para acelerar respuesta, decision y cierre.
      </p>
      <div className="roadmap-card-links">
        <Link to="/catalogo" className="roadmap-link">
          Ver catalogo completo
        </Link>
        <Link to="/carrito" className="roadmap-link">
          Revisar carrito
        </Link>
        <Link to="/cuenta" className="roadmap-link">
          Abrir mi cuenta
        </Link>
        <a
          href="https://wa.me/50600000000?text=Hola%2C%20quiero%20ayuda%20para%20elegir%20suplementos"
          target="_blank"
          rel="noreferrer"
          className="roadmap-link"
        >
          Hablar por WhatsApp
        </a>
      </div>
    </aside>
  )
}

export default RoadmapCard
