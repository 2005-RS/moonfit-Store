export type FeatureText = {
  title: string
  text: string
}

export type FeatureItem = FeatureText & {
  eyebrow?: string
  status?: string
  highlights?: string[]
  to?: string
  href?: string
  linkLabel?: string
  external?: boolean
}

export type FeatureSectionStat = {
  value: string
  label: string
}

export type SpotlightCard = FeatureText & {
  eyebrow: string
}

export type Metric = {
  value: string
  label: string
}

export type FeatureSectionData = {
  id: string
  eyebrow: string
  title: string
  description: string
  badges?: string[]
  stats?: FeatureSectionStat[]
  icon: string
  iconClassName?: string
  items: FeatureItem[]
  sectionClassName?: string
  gridClassName?: string
}
