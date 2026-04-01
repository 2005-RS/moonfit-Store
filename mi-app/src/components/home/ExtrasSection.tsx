import type { FeatureSectionData } from '../../types/ecommerce'
import FeatureCard from '../shared/FeatureCard'
import SectionHeading from '../shared/SectionHeading'
import RoadmapCard from './RoadmapCard'

type ExtrasSectionProps = {
  section: FeatureSectionData
}

function ExtrasSection({ section }: ExtrasSectionProps) {
  const gridClassName = ['feature-grid', section.gridClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="content-section" id={section.id}>
      <SectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        description={section.description}
      />

      <div className="extras-layout">
        <div className={gridClassName}>
          {section.items.map((item) => (
            <FeatureCard
              key={item.title}
              icon={section.icon}
              iconClassName={section.iconClassName}
              title={item.title}
              text={item.text}
              to={item.to}
              href={item.href}
              linkLabel={item.linkLabel}
              external={item.external}
            />
          ))}
        </div>

        <RoadmapCard />
      </div>
    </section>
  )
}

export default ExtrasSection
