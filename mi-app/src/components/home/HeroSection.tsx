import { Link } from 'react-router-dom'
import { formatCurrency } from '../../lib/currency'
import type { AdminCampaign } from '../../types/admin'
import type { Product } from '../../types/catalog'
import type { Metric } from '../../types/ecommerce'

export type StoreHeroMission = {
  id: string
  label: string
  eyebrow: string
  title: string
  description: string
  supportCopy: string
  highlights: string[]
  primaryProduct?: Product
  secondaryProducts: Product[]
}

type HeroSectionProps = {
  metrics: Metric[]
  missions: StoreHeroMission[]
  activeMissionId: string
  onMissionChange: (missionId: string) => void
  featuredCampaign?: AdminCampaign | null
}

function HeroSection({
  metrics,
  missions,
  activeMissionId,
  onMissionChange,
  featuredCampaign,
}: HeroSectionProps) {
  const activeMission =
    missions.find((mission) => mission.id === activeMissionId) ?? missions[0]
  const featuredProduct = activeMission?.primaryProduct

  return (
    <section className="hero-section">
      <div className="hero-copy">
        <div className="hero-copy-topline">
          <p className="eyebrow">Moonfit / tienda deportiva</p>
          <span className="hero-live-pill">
            {featuredCampaign?.discountTag || 'Selecciones cuidadas y asesoria cercana'}
          </span>
        </div>

        <h1>
          {featuredCampaign?.title ??
            'Todo lo que acompana tu entrenamiento, con una experiencia mas serena y refinada.'}
        </h1>
        <p className="hero-text">
          {featuredCampaign?.subtitle ??
            'Moonfit reune suplementos, accesorios y esenciales deportivos en una tienda pensada para descubrir con calma y elegir con criterio.'}
        </p>

        <div className="hero-tab-row" role="tablist" aria-label="Objetivos destacados">
          {missions.map((mission) => (
            <button
              key={mission.id}
              type="button"
              role="tab"
              className={[
                'hero-tab-button',
                mission.id === activeMission?.id ? 'hero-tab-button-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-selected={mission.id === activeMission?.id}
              onClick={() => onMissionChange(mission.id)}
            >
              {mission.label}
            </button>
          ))}
        </div>

        {activeMission ? (
          <div className="hero-mission-card">
            <div className="hero-mission-heading">
              <p className="hero-mission-eyebrow">{activeMission.eyebrow}</p>
              <h2>{activeMission.title}</h2>
              <p>{activeMission.description}</p>
            </div>

            <div className="hero-highlight-grid">
              {activeMission.highlights.map((highlight, index) => (
                <article key={highlight} className="hero-highlight-card">
                  <span>0{index + 1}</span>
                  <strong>{highlight}</strong>
                </article>
              ))}
            </div>

            <p className="hero-mission-support">{activeMission.supportCopy}</p>

            <div className="hero-actions">
              <Link to={featuredCampaign?.ctaHref || '/catalogo'} className="primary-link">
                {featuredCampaign?.ctaLabel || 'Descubrir catalogo'}
              </Link>
              <a
                href="https://wa.me/50600000000?text=Hola%2C%20quiero%20ayuda%20para%20elegir%20mi%20stack"
                target="_blank"
                rel="noreferrer"
                className="secondary-link hero-secondary-link"
              >
                Recibir asesoria
              </a>
            </div>
          </div>
        ) : null}

        <div className="hero-result-strip">
          {metrics.map((metric) => (
            <article className="hero-result-card" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>
      </div>

      <aside className="hero-panel">
        {featuredProduct ? (
          <article className="hero-feature-card">
            <div className="hero-feature-media">
              <img
                src={featuredProduct.image}
                alt={featuredProduct.name}
                className="hero-product-image"
              />
              {featuredProduct.badge ? (
                <span className="hero-feature-badge">{featuredProduct.badge}</span>
              ) : null}
            </div>

            <div className="hero-feature-body">
              <p className="panel-label">
                {activeMission?.label || 'Producto destacado'}
              </p>
              <h3>{featuredProduct.name}</h3>
              <p>{featuredProduct.description}</p>

              <div className="hero-product-tag-row">
                <span className="hero-product-tag">{featuredProduct.brand}</span>
                <span className="hero-product-tag">{featuredProduct.category}</span>
                {featuredProduct.goals.slice(0, 1).map((goal) => (
                  <span key={goal} className="hero-product-tag">
                    {goal}
                  </span>
                ))}
              </div>

              <div className="price-row hero-product-price">
                <strong>{formatCurrency(featuredProduct.price)}</strong>
                {featuredProduct.previousPrice ? (
                  <span>{formatCurrency(featuredProduct.previousPrice)}</span>
                ) : null}
              </div>

              <Link
                to={`/producto/${featuredProduct.slug}`}
                className="secondary-link hero-product-link"
              >
                Ver producto destacado
              </Link>
            </div>
          </article>
        ) : (
          <article className="hero-fallback-card">
            <p className="panel-label">Stack destacado</p>
            <h3>Prepara una vitrina serena para suplementos, fuerza y recuperacion.</h3>
            <p>
              Cuando cargues productos, esta zona mostrara una pieza protagonista
              y sugerencias asociadas al objetivo activo.
            </p>
          </article>
        )}

        <div className="hero-panel-bottom">
          <div className="hero-panel-list">
            <p className="panel-label hero-panel-label">Selecciones sugeridas</p>
            {activeMission?.secondaryProducts.length ? (
              activeMission.secondaryProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/producto/${product.slug}`}
                  className="hero-stack-link"
                >
                  <span>{product.category}</span>
                  <strong>{product.name}</strong>
                  <small>{formatCurrency(product.price)}</small>
                </Link>
              ))
            ) : (
              <div className="status-card hero-status-card">
                <span className="status-dot" />
                <div>
                  <p className="status-title">Seleccion viva</p>
                  <p className="status-text">
                    Carga productos y deja que la portada agrupe selecciones por
                    objetivo de entrenamiento.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="hero-service-card">
            <p className="panel-label">Asesoria cercana</p>
            <strong>Te orientamos para elegir con mas claridad y confianza.</strong>
            <p>
              Ideal para comparar opciones, resolver dudas y concluir tu compra con calma.
            </p>
            <a
              href="https://wa.me/50600000000?text=Hola%2C%20quiero%20asesoria%20para%20comprar"
              target="_blank"
              rel="noreferrer"
              className="hero-service-link"
            >
              Hablar por WhatsApp
            </a>
          </div>
        </div>
      </aside>
    </section>
  )
}

export default HeroSection
