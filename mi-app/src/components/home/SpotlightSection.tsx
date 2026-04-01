import type { SpotlightCard } from '../../types/ecommerce'

type SpotlightSectionProps = {
  cards: SpotlightCard[]
}

function SpotlightSection({ cards }: SpotlightSectionProps) {
  return (
    <section className="spotlight-grid" aria-label="Puntos clave del ecommerce">
      {cards.map((card) => (
        <article className="spotlight-card" key={card.title}>
          <p className="eyebrow">{card.eyebrow}</p>
          <h2>{card.title}</h2>
          <p>{card.text}</p>
        </article>
      ))}
    </section>
  )
}

export default SpotlightSection
