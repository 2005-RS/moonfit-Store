import { Link } from 'react-router-dom'

type FeatureCardProps = {
  icon: string
  iconClassName?: string
  title: string
  text: string
  eyebrow?: string
  status?: string
  highlights?: string[]
  to?: string
  href?: string
  linkLabel?: string
  external?: boolean
}

function FeatureCard({
  icon,
  iconClassName = '',
  title,
  text,
  eyebrow,
  status,
  highlights,
  to,
  href,
  linkLabel,
  external = false,
}: FeatureCardProps) {
  const className = ['feature-icon', iconClassName].filter(Boolean).join(' ')
  const content = (
    <>
      <div className="feature-card-topline">
        <span className={className}>{icon}</span>
        {status ? <span className="feature-card-status">{status}</span> : null}
      </div>
      {eyebrow ? <p className="feature-card-kicker">{eyebrow}</p> : null}
      <div className="feature-card-body">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      {highlights?.length ? (
        <div className="feature-card-highlights">
          {highlights.map((highlight) => (
            <span key={highlight} className="feature-card-highlight">
              {highlight}
            </span>
          ))}
        </div>
      ) : null}
      {to || href ? (
        <span className="feature-card-cta">{linkLabel ?? 'Abrir'}</span>
      ) : null}
    </>
  )

  if (to) {
    return (
      <Link to={to} className="feature-card">
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        className="feature-card"
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
      >
        {content}
      </a>
    )
  }

  return <article className="feature-card">{content}</article>
}

export default FeatureCard
