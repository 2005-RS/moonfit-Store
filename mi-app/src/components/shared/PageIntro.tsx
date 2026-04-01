type PageIntroProps = {
  eyebrow: string
  title: string
  description: string
}

function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <section className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="hero-text">{description}</p>
    </section>
  )
}

export default PageIntro
