import type { FeatureSectionData } from '../../types/ecommerce'
import FeatureCard from '../shared/FeatureCard'
import SectionHeading from '../shared/SectionHeading'

type FeatureSectionProps = {
  section: FeatureSectionData
}

function FeatureSection({ section }: FeatureSectionProps) {
  const sectionClassName = [
    'content-section',
    `content-section-${section.id}`,
    section.sectionClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const gridClassName = ['feature-grid', section.gridClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={sectionClassName} id={section.id}>
      <SectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        description={section.description}
      />

      {section.badges?.length || section.stats?.length ? (
        <div className="feature-section-summary">
          {section.badges?.length ? (
            <div className="feature-section-chips">
              {section.badges.map((badge) => (
                <span key={badge} className="feature-section-chip">
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          {section.stats?.length ? (
            <div className="feature-section-stats">
              {section.stats.map((stat) => (
                <article key={stat.label} className="feature-section-stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={gridClassName}>
        {section.items.map((item) => (
          <FeatureCard
            key={item.title}
            icon={section.icon}
            iconClassName={section.iconClassName}
            title={item.title}
            text={item.text}
            eyebrow={item.eyebrow}
            status={item.status}
            highlights={item.highlights}
            to={item.to}
            href={item.href}
            linkLabel={item.linkLabel}
            external={item.external}
          />
        ))}
      </div>
    </section>
  )
}

export default FeatureSection
