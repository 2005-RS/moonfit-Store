import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import {
  customerSection,
  extrasSection,
  spotlightCards,
} from '../../data/ecommerceContent'
import ProductCard from '../../components/catalog/ProductCard'
import ExtrasSection from '../../components/home/ExtrasSection'
import FeatureSection from '../../components/home/FeatureSection'
import HeroSection, { type StoreHeroMission } from '../../components/home/HeroSection'
import SpotlightSection from '../../components/home/SpotlightSection'
import { useCart } from '../../context/CartContext'
import { useCommerce } from '../../context/CommerceContext'
import { fetchActiveCampaigns, fetchActiveCombos } from '../../lib/adminApi'
import { formatCurrency } from '../../lib/currency'
import type { AdminCampaign } from '../../types/admin'
import type { Product, StoreCombo } from '../../types/catalog'

type MissionId = 'volumen' | 'fuerza' | 'definicion' | 'home-gym'

type HomeMission = StoreHeroMission & {
  availableCount: number
  searchPlaceholder: string
}

const missionBlueprints: Array<{
  id: MissionId
  label: string
  eyebrow: string
  title: string
  description: string
  supportCopy: string
  highlights: string[]
  searchPlaceholder: string
  matchers: string[]
  fallbackStart: number
}> = [
  {
    id: 'volumen',
    label: 'Volumen',
    eyebrow: 'Masa armoniosa',
    title: 'Una seleccion pensada para ganar volumen con equilibrio, constancia y buena recuperacion.',
    description:
      'Proteinas, creatina y apoyo post entreno reunidos en una lectura mas clara para elegir con seguridad.',
    supportCopy:
      'Una vitrina ideal para quien busca una base solida y una compra bien guiada desde el inicio.',
    highlights: [
      'Proteina y recuperacion en una misma ruta',
      'Combinaciones pensadas con coherencia',
      'Mensajes claros para una constancia sostenida',
    ],
    searchPlaceholder: 'Busca whey, mass gainer, recovery o creatina',
    matchers: ['masa', 'muscular', 'proteina', 'whey', 'recuperacion', 'volumen'],
    fallbackStart: 0,
  },
  {
    id: 'fuerza',
    label: 'Fuerza',
    eyebrow: 'Potencia serena',
    title: 'Potencia, rendimiento y accesorios reunidos para sesiones intensas y bien preparadas.',
    description:
      'Creatina, rendimiento y accesorios de fuerza organizados con una presencia mas sobria y precisa.',
    supportCopy:
      'Ideal para presentar una seleccion firme, clara y elegante desde la portada.',
    highlights: [
      'Creatina, agarre y apoyo para potencia',
      'Piezas listas para sesiones exigentes',
      'Una seleccion coherente de fuerza y soporte',
    ],
    searchPlaceholder: 'Busca creatina, pre, straps o accesorios de fuerza',
    matchers: ['fuerza', 'rendimiento', 'potencia', 'creatina', 'agarre'],
    fallbackStart: 1,
  },
  {
    id: 'definicion',
    label: 'Definicion',
    eyebrow: 'Ligereza y foco',
    title: 'Una experiencia enfocada en definicion, energia y constancia cotidiana.',
    description:
      'Una entrada cuidada para apoyo, cardio y bienestar diario, sin exceso visual ni interrupciones.',
    supportCopy:
      'Pensada para quien valora una compra clara, disciplinada y facil de retomar.',
    highlights: [
      'Compra guiada para rutina y constancia',
      'Secciones mas limpias para cardio y energia',
      'Una vista natural para volver a comprar',
    ],
    searchPlaceholder: 'Busca cardio, tonificacion, energia o control',
    matchers: ['defin', 'grasa', 'cardio', 'tonificacion', 'energia', 'control'],
    fallbackStart: 0,
  },
  {
    id: 'home-gym',
    label: 'Home gym',
    eyebrow: 'Movimiento en casa',
    title: 'Implementos, bandas y accesorios para entrenar con libertad desde casa o estudio.',
    description:
      'Da protagonismo a piezas visuales y funcionales con una identidad activa, limpia y bien resuelta.',
    supportCopy:
      'Ideal para mezclar bienestar, fuerza y accesorios dentro de una experiencia mas amplia y armoniosa.',
    highlights: [
      'Bandas, accesorios y compra practica',
      'Una mezcla elegante entre implementos y bienestar',
      'Selecciones utiles para empezar o continuar',
    ],
    searchPlaceholder: 'Busca bandas, guantes, home gym o accesorios',
    matchers: ['home gym', 'casa', 'implementos', 'accesorios', 'bandas', 'movilidad'],
    fallbackStart: 2,
  },
]

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

function productMatchesMission(product: Product, matchers: string[]) {
  const haystack = [
    product.name,
    product.brand,
    product.category,
    product.description,
    ...product.goals,
  ]
    .join(' ')
    .toLowerCase()

  return matchers.some((matcher) => haystack.includes(matcher))
}

function getFallbackProducts(products: Product[], fallbackStart: number) {
  const slicedProducts = products.slice(fallbackStart, fallbackStart + 3)

  if (slicedProducts.length > 0) {
    return slicedProducts
  }

  return products.slice(0, 3)
}

function HomePage() {
  const { addBundleToCart, addToCart } = useCart()
  const { products } = useCommerce()
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([])
  const [combos, setCombos] = useState<StoreCombo[]>([])
  const [activeMissionId, setActiveMissionId] = useState<MissionId>('volumen')
  const [finderQuery, setFinderQuery] = useState('')
  const deferredFinderQuery = useDeferredValue(finderQuery)
  const newProducts = products.slice(0, 2)
  const offerProducts = products.filter((product) => product.previousPrice).slice(0, 2)
  const featuredProducts = products.slice(0, 4)
  const heroProduct = products[0]
  const stackProducts = products.slice(0, 3)
  const heroCampaign = campaigns.find((campaign) => campaign.placement === 'home-hero') ?? null
  const secondaryCampaigns = campaigns.filter(
    (campaign) => campaign.placement === 'home-secondary',
  )
  const heroMetrics = useMemo(
    () => [
      {
        value: String(products.length).padStart(2, '0'),
        label: 'piezas en tienda',
      },
      {
        value: String(products.filter((product) => product.previousPrice).length).padStart(2, '0'),
        label: 'precios especiales',
      },
      {
        value: String(combos.length).padStart(2, '0'),
        label: 'selecciones listas',
      },
    ],
    [combos.length, products],
  )
  const missionExperience = useMemo<HomeMission[]>(
    () =>
      missionBlueprints.map((mission) => {
        const matchedProducts = products.filter((product) =>
          productMatchesMission(product, mission.matchers),
        )
        const relatedProducts =
          matchedProducts.length > 0
            ? matchedProducts.slice(0, 3)
            : getFallbackProducts(products, mission.fallbackStart)

        return {
          id: mission.id,
          label: mission.label,
          eyebrow: mission.eyebrow,
          title: mission.title,
          description: mission.description,
          supportCopy: mission.supportCopy,
          highlights: mission.highlights,
          primaryProduct: relatedProducts[0],
          secondaryProducts: relatedProducts.slice(1, 3),
          availableCount: matchedProducts.length || relatedProducts.length,
          searchPlaceholder: mission.searchPlaceholder,
        }
      }),
    [products],
  )
  const activeMission =
    missionExperience.find((mission) => mission.id === activeMissionId) ??
    missionExperience[0]
  const finderProducts = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(deferredFinderQuery)
    const selectedMission =
      missionBlueprints.find((mission) => mission.id === activeMissionId) ??
      missionBlueprints[0]
    const missionProducts = products.filter((product) =>
      productMatchesMission(product, selectedMission.matchers),
    )
    const sourceProducts =
      missionProducts.length > 0
        ? missionProducts
        : getFallbackProducts(products, selectedMission.fallbackStart)

    return sourceProducts
      .filter((product) => {
        if (!normalizedQuery) {
          return true
        }

        return [
          product.name,
          product.brand,
          product.category,
          product.description,
          ...product.goals,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      })
      .sort(
        (productA, productB) =>
          Number(Boolean(productB.previousPrice)) -
            Number(Boolean(productA.previousPrice)) || productB.stock - productA.stock,
      )
      .slice(0, 3)
  }, [activeMissionId, deferredFinderQuery, products])
  const storePulseCards = useMemo(
    () => [
      {
        label: 'Entrega cuidada',
        value: 'Compra clara + coordinacion cercana',
        text: 'Una experiencia pensada para comprar con serenidad desde la primera mirada.',
      },
      {
        label: 'Seleccion actual',
        value: activeMission?.label || 'Curaduria guiada',
        text: activeMission?.description || 'La portada cambia de tono segun el objetivo que quieras explorar.',
      },
      {
        label: 'Ediciones disponibles',
        value: `${String(combos.length).padStart(2, '0')} selecciones listas`,
        text: 'Combinaciones pensadas para descubrir piezas que dialogan bien entre si.',
      },
    ],
    [activeMission, combos.length],
  )
  const customerStoreSection = useMemo(
    () => ({
      ...customerSection,
      items: customerSection.items.map((item) =>
        item.title === 'Detalle con beneficios' && heroProduct
          ? { ...item, to: `/producto/${heroProduct.slug}` }
          : item,
      ),
    }),
    [heroProduct],
  )

  useEffect(() => {
    const loadCampaigns = async () => {
      const [activeCampaigns, activeCombos] = await Promise.all([
        fetchActiveCampaigns(),
        fetchActiveCombos(),
      ])
      setCampaigns(activeCampaigns)
      setCombos(activeCombos)
    }

    void loadCampaigns()
  }, [])

  useEffect(() => {
    if (missionExperience.some((mission) => mission.id === activeMissionId)) {
      return
    }

    setActiveMissionId((missionExperience[0]?.id ?? 'volumen') as MissionId)
  }, [activeMissionId, missionExperience])

  const rotateMission = useEffectEvent(() => {
    if (missionExperience.length < 2) {
      return
    }

    startTransition(() => {
      setActiveMissionId((currentMissionId) => {
        const currentIndex = missionExperience.findIndex(
          (mission) => mission.id === currentMissionId,
        )
        const safeIndex = currentIndex >= 0 ? currentIndex : 0
        const nextMission = missionExperience[(safeIndex + 1) % missionExperience.length]

        return nextMission.id as MissionId
      })
    })
  })

  useEffect(() => {
    if (missionExperience.length < 2) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      rotateMission()
    }, 6500)

    return () => window.clearInterval(intervalId)
  }, [missionExperience.length])

  const handleMissionChange = (missionId: string) => {
    startTransition(() => {
      setActiveMissionId(missionId as MissionId)
    })
  }

  return (
    <div className="page-shell home-page-shell">
      <HeroSection
        metrics={heroMetrics}
        missions={missionExperience}
        activeMissionId={activeMission?.id || 'volumen'}
        onMissionChange={handleMissionChange}
        featuredCampaign={heroCampaign}
      />

      <section className="performance-lab" id="performance-lab">
        <div className="performance-lab-copy">
          <p className="eyebrow">Exploracion guiada</p>
          <h2>Encuentra una seleccion afin a tu objetivo en segundos.</h2>
          <p>
            Filtra por objetivo, busca suplementos o accesorios y descubre una
            ruta mas clara para elegir desde el primer vistazo.
          </p>

          <label className="performance-search-card" htmlFor="performance-search">
            <span>Busqueda guiada</span>
            <input
              id="performance-search"
              type="search"
              value={finderQuery}
              onChange={(event) => setFinderQuery(event.target.value)}
              placeholder={
                activeMission?.searchPlaceholder ||
                'Busca suplementos, accesorios o marcas'
              }
            />
          </label>

          <div className="performance-filter-row" role="tablist" aria-label="Objetivos de compra">
            {missionExperience.map((mission) => (
              <button
                key={mission.id}
                type="button"
                role="tab"
                className={[
                  'performance-filter-card',
                  mission.id === activeMission?.id ? 'performance-filter-card-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-selected={mission.id === activeMission?.id}
                onClick={() => handleMissionChange(mission.id)}
              >
                <span>{mission.label}</span>
                <strong>{String(mission.availableCount).padStart(2, '0')}</strong>
                <small>{mission.eyebrow}</small>
              </button>
            ))}
          </div>

          <div className="performance-note-grid">
            {activeMission?.highlights.map((highlight, index) => (
              <article key={highlight} className="performance-note-card">
                <span>0{index + 1}</span>
                <strong>{highlight}</strong>
              </article>
            ))}
          </div>
        </div>

        <div className="performance-lab-results">
          <div className="performance-results-head">
            <div>
              <p className="panel-label">Seleccion para {activeMission?.label || 'tu objetivo'}</p>
              <strong>
                {finderProducts.length > 0
                  ? `${finderProducts.length} opciones listas para explorar`
                  : 'Sin coincidencias por ahora'}
              </strong>
            </div>
            <Link to="/catalogo" className="secondary-link performance-results-link">
              Ver catalogo completo
            </Link>
          </div>

          {finderProducts.length > 0 ? (
            <div className="performance-result-grid">
              {finderProducts.map((product) => (
                <article key={product.id} className="performance-product-card">
                  <div className="performance-product-media">
                    <img src={product.image} alt={product.name} className="performance-product-image" />
                    {product.badge ? (
                      <span className="performance-product-badge">{product.badge}</span>
                    ) : null}
                  </div>

                  <div className="performance-product-body">
                    <div className="performance-product-topline">
                      <span>{product.category}</span>
                      <strong>{product.brand}</strong>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>

                    <div className="performance-goal-pills">
                      {product.goals.slice(0, 2).map((goal) => (
                        <span key={goal} className="performance-goal-pill">
                          {goal}
                        </span>
                      ))}
                    </div>

                    <div className="performance-product-footer">
                      <div className="price-stack">
                        <strong>{formatCurrency(product.price)}</strong>
                        {product.previousPrice ? (
                          <span>{formatCurrency(product.previousPrice)}</span>
                        ) : null}
                      </div>

                      <div className="performance-product-actions">
                        <button
                          className="primary-link button-link performance-action-button"
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                        >
                          {product.stock > 0 ? 'Agregar' : 'Sin stock'}
                        </button>
                        <Link to={`/producto/${product.slug}`} className="secondary-link">
                          Ver detalle
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article className="performance-empty-card">
              <p className="panel-label">Sin resultados</p>
              <strong>Ajusta la busqueda o cambia de objetivo para descubrir nuevas opciones.</strong>
              <p>
                La portada seguira mostrando selecciones destacadas aunque el
                filtro actual no encuentre coincidencias.
              </p>
            </article>
          )}
        </div>
      </section>

      <section className="store-marquee premium-marquee" aria-label="Promesas de la tienda">
        {storePulseCards.map((card) => (
          <div key={card.label} className="marquee-card premium-marquee-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.text}</p>
          </div>
        ))}
      </section>

      {secondaryCampaigns.length > 0 ? (
        <section className="campaign-preview-grid">
          {secondaryCampaigns.map((campaign) => (
            <article key={campaign.id} className="campaign-preview-card">
              <img
                src={campaign.image}
                alt={campaign.title}
                className="campaign-preview-image"
              />
              <div>
                <p className="eyebrow">Seleccion destacada</p>
                <h2>{campaign.title}</h2>
                <p>{campaign.subtitle}</p>
                <div className="hero-actions">
                  <a className="secondary-link" href={campaign.ctaHref}>
                    {campaign.ctaLabel}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <section className="store-section highlighted-section" id="stacks-combos">
        <div className="section-heading">
          <p className="eyebrow">Selecciones sugeridas</p>
          <h2>Combinaciones pensadas para comprar con mas claridad</h2>
          <p>
            Descubre piezas que dialogan bien entre si y facilitan una compra
            mas intuitiva desde la portada.
          </p>
        </div>

        <div className="stack-grid">
          {stackProducts.map((product, index) => (
            <article key={product.id} className="stack-card">
              <span>Stack {index + 1}</span>
              <strong>{product.name}</strong>
              <p>{product.description}</p>
              <div className="stack-meta">
                <small>{product.category}</small>
                <small>{formatCurrency(product.price)}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      {combos.length > 0 ? (
        <section className="store-section highlighted-section">
          <div className="section-heading">
            <p className="eyebrow">Combos destacados</p>
            <h2>Paquetes listos para simplificar una compra mas completa</h2>
            <p>
              Reune varias piezas en una sola seleccion y descubre una forma
              mas fluida de comprar.
            </p>
          </div>

          <div className="campaign-preview-grid">
            {combos.map((combo) => (
              <article key={combo.id} className="campaign-preview-card">
                <img
                  src={combo.image}
                  alt={combo.title}
                  className="campaign-preview-image"
                />
                <div>
                  <p className="eyebrow">Combo</p>
                  <h2>{combo.title}</h2>
                  <p>{combo.subtitle}</p>
                  <small className="muted-line">
                    {combo.items
                      .map((item) => `${item.product.name} x${item.quantity}`)
                      .join(', ')}
                  </small>
                  <div className="price-row detail-price">
                    <strong>{formatCurrency(combo.price)}</strong>
                    {combo.previousPrice ? <span>{formatCurrency(combo.previousPrice)}</span> : null}
                  </div>
                  <div className="hero-actions">
                    <button
                      className="primary-link button-link"
                      type="button"
                      onClick={() => addBundleToCart(combo.items)}
                    >
                      {combo.ctaLabel}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="store-section" id="nuevos-lanzamientos">
        <div className="section-heading">
          <p className="eyebrow">Nuevos productos</p>
          <h2>Novedades para recuperacion, fuerza y movimiento en casa</h2>
          <p>
            Descubre incorporaciones recientes elegidas para acompanar distintas
            formas de entrenar y cuidarte.
          </p>
        </div>

        <div className="product-grid">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <SpotlightSection cards={spotlightCards} />

      <section className="store-section highlighted-section" id="ofertas-del-mes">
        <div className="section-heading">
          <p className="eyebrow">Ofertas</p>
          <h2>Precios especiales para descubrir con calma</h2>
          <p>
            Compara el valor de cada producto con precios visibles y una
            presentacion mas clara.
          </p>
        </div>

        <div className="product-grid">
          {offerProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="store-section" id="mas-vendidos">
        <div className="section-heading">
          <p className="eyebrow">Mas elegidos</p>
          <h2>Piezas que inspiran confianza desde la primera vista</h2>
          <p>
            Una seleccion de favoritos de la tienda para orientarte con mayor
            claridad al elegir.
          </p>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="whatsapp-band" id="compra-whatsapp">
        <div>
          <p className="eyebrow">Asesoria directa</p>
          <h2>Recibe acompanamiento por WhatsApp cuando quieras comparar opciones con calma.</h2>
          <p>
            Un canal cercano para resolver dudas, pedir una recomendacion y
            terminar tu compra con mas confianza.
          </p>
        </div>
        <a
          className="primary-link whatsapp-link"
          href="https://wa.me/50600000000?text=Hola%2C%20quiero%20ayuda%20para%20elegir%20suplementos"
          target="_blank"
          rel="noreferrer"
        >
          Hablar por WhatsApp
        </a>
      </section>

      <FeatureSection section={customerStoreSection} />
      <ExtrasSection section={extrasSection} />
    </div>
  )
}

export default HomePage
