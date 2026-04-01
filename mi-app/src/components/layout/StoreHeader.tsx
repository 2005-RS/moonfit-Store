import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import MoonfitBrand from '../branding/MoonfitBrand'
import { useCart } from '../../context/CartContext'
import { useCommerce } from '../../context/CommerceContext'
import { useStorefrontUi } from '../../context/StorefrontUiContext'
import { featuredCategories } from '../../data/catalogData'
import { formatCurrency } from '../../lib/currency'

const storeLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catalogo' },
  { to: '/cuenta', label: 'Mi cuenta' },
  { to: '/carrito', label: 'Carrito' },
]

const aboutUsCards = [
  {
    label: 'Curaduria',
    title: 'Seleccionamos piezas y suplementos con criterio estetico y funcional.',
    description:
      'Cada categoria busca sentirse clara, util y coherente con distintas metas de entrenamiento y bienestar.',
  },
  {
    label: 'Acompanamiento',
    title: 'Acompanamos cada eleccion con una voz cercana y tranquila.',
    description:
      'Queremos que comparar, preguntar y decidir se sienta natural desde el primer momento.',
  },
  {
    label: 'Confianza',
    title: 'Cuidamos cada detalle para que la experiencia se sienta serena y segura.',
    description:
      'Desde la navegacion hasta la entrega, buscamos una compra mas amable, ordenada y confiable.',
  },
]

function buildCatalogPath(params: Record<string, string>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  const serializedQuery = searchParams.toString()

  return serializedQuery ? `/catalogo?${serializedQuery}` : '/catalogo'
}

function StoreHeader() {
  const { itemCount, subtotal } = useCart()
  const { products } = useCommerce()
  const { openCartDrawer } = useStorefrontUi()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeHeaderPanel, setActiveHeaderPanel] = useState<
    'about' | 'categories' | 'promotions' | null
  >(null)

  const headerCategories = useMemo(() => {
    const productCategories = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    )

    const orderedKnownCategories = featuredCategories.filter(
      (category) => category !== 'Ofertas' && productCategories.includes(category),
    )
    const remainingCategories = productCategories
      .filter((category) => !orderedKnownCategories.includes(category))
      .sort()

    return [...orderedKnownCategories, ...remainingCategories].map((category) => ({
      label: category,
      count: products.filter((product) => product.category === category).length,
      to: buildCatalogPath({ categoria: category }),
    }))
  }, [products])

  const offersCount = useMemo(
    () => products.filter((product) => product.previousPrice).length,
    [products],
  )

  useEffect(() => {
    setIsMenuOpen(false)
    setActiveHeaderPanel(null)
  }, [location.hash, location.pathname])

  const promotionCards = [
    {
      label: 'Ofertas activas',
      title: `${offersCount} piezas con precio especial visible`,
      description:
        'Entra al catalogo con la seleccion lista para comparar opciones y descubrir el mejor equilibrio.',
      to: buildCatalogPath({ categoria: 'Ofertas', promociones: '1' }),
    },
    {
      label: 'Combos',
      title: 'Combinaciones pensadas para comprar con mas armonia',
      description:
        'Explora sets destacados y rutas breves para descubrir piezas que conviven bien entre si.',
      to: '/#stacks-combos',
    },
    {
      label: 'Promos del mes',
      title: 'Momentos destacados dentro de la tienda',
      description:
        'Una forma directa de llegar a las secciones que hoy merecen mayor atencion.',
      to: '/#ofertas-del-mes',
    },
  ]

  const isAboutOpen = activeHeaderPanel === 'about'
  const isCategoriesOpen = activeHeaderPanel === 'categories'
  const isPromotionsOpen = activeHeaderPanel === 'promotions'

  const handlePanelToggle = (panelId: 'about' | 'categories' | 'promotions') => {
    setActiveHeaderPanel((currentValue) => (currentValue === panelId ? null : panelId))
  }

  return (
    <header className="site-header">
      <div className="site-header-top">
        <div className="header-brand-block">
          <NavLink to="/" className="brand-mark">
            <MoonfitBrand
              theme="light"
              subtitle="Tienda deportiva"
              className="header-brand-lockup"
            />
          </NavLink>

          <div className="header-trust-strip" aria-label="Acciones del encabezado">
            <button
              type="button"
              className={[
                'header-inline-toggle',
                isAboutOpen ? 'header-inline-toggle-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handlePanelToggle('about')}
              aria-expanded={isAboutOpen}
              aria-controls="store-header-panel"
            >
              Sobre nosotros
            </button>
            <button
              type="button"
              className={[
                'header-inline-toggle',
                isCategoriesOpen ? 'header-inline-toggle-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handlePanelToggle('categories')}
              aria-expanded={isCategoriesOpen}
              aria-controls="store-header-panel"
            >
              Categorias
            </button>
            <button
              type="button"
              className={[
                'header-inline-toggle',
                isPromotionsOpen ? 'header-inline-toggle-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handlePanelToggle('promotions')}
              aria-expanded={isPromotionsOpen}
              aria-controls="store-header-panel"
            >
              Promociones
            </button>
          </div>
        </div>

        <div className="header-actions-block">
          <div className="header-utility">
            <div className="header-utility-copy">
              <span>Tu seleccion</span>
              <strong>{itemCount} productos</strong>
              <small>{formatCurrency(subtotal)}</small>
            </div>
            <button
              type="button"
              className="header-cart-button"
              onClick={openCartDrawer}
            >
              Abrir carrito
            </button>
          </div>

          <button
            type="button"
            className="header-menu-toggle"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            aria-expanded={isMenuOpen}
            aria-controls="store-navigation"
          >
            Menu
          </button>
        </div>
      </div>

      {activeHeaderPanel ? (
        <section
          className="header-about-panel"
          id="store-header-panel"
          aria-labelledby="header-about-title"
        >
          {isAboutOpen ? (
            <>
              <div className="header-about-copy">
                <p className="header-about-eyebrow">Sobre nosotros</p>
                <h2 id="header-about-title">
                  En Moonfit reunimos movimiento, bienestar y estilo en una experiencia
                  de compra serena.
                </h2>
                <p>
                  Creamos una tienda deportiva con una identidad limpia y cercana,
                  donde descubrir productos, recibir asesoria y comprar se sienta
                  natural, claro y confiable.
                </p>
              </div>

              <div className="header-panel-grid" aria-label="Pilares de Moonfit">
                {aboutUsCards.map((card) => (
                  <article key={card.title} className="header-panel-card">
                    <span>{card.label}</span>
                    <strong>{card.title}</strong>
                    <p>{card.description}</p>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {isCategoriesOpen ? (
            <>
              <div className="header-about-copy">
                <p className="header-about-eyebrow">Categorias</p>
                <h2 id="header-about-title">
                  Explora el catalogo por familias de producto desde el mismo header.
                </h2>
                <p>
                  Abre una coleccion ya filtrada para llegar con suavidad a proteinas,
                  rendimiento, implementos o accesorios sin recorrer toda la grilla.
                </p>
              </div>

              <div className="header-panel-grid" aria-label="Categorias de productos">
                {headerCategories.map((category) => (
                  <Link
                    key={category.label}
                    to={category.to}
                    className="header-panel-link"
                    onClick={() => setActiveHeaderPanel(null)}
                  >
                    <span>Categoria</span>
                    <strong>{category.label}</strong>
                    <p>Entra con una seleccion afinada para explorar esa familia de productos.</p>
                    <small>{category.count} productos</small>
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          {isPromotionsOpen ? (
            <>
              <div className="header-about-copy">
                <p className="header-about-eyebrow">Promociones</p>
                <h2 id="header-about-title">
                  Descubre ofertas, selecciones y momentos destacados sin salir de la tienda.
                </h2>
                <p>
                  Este bloque abre rutas breves hacia descuentos visibles, selecciones especiales
                  y accesos pensados para inspirar una compra mas clara.
                </p>
              </div>

              <div className="header-panel-grid" aria-label="Promociones y accesos rapidos">
                {promotionCards.map((card) => (
                  <Link
                    key={card.title}
                    to={card.to}
                    className="header-panel-link"
                    onClick={() => setActiveHeaderPanel(null)}
                  >
                    <span>{card.label}</span>
                    <strong>{card.title}</strong>
                    <p>{card.description}</p>
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      <div
        className={['site-header-bottom', isMenuOpen ? 'site-header-bottom-open' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <nav className="main-nav" id="store-navigation" aria-label="Tienda">
          {storeLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                ['nav-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
            >
              {link.label}
              {link.to === '/carrito' ? (
                <span className="cart-count">{itemCount}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="header-shortcuts" aria-label="Accesos rapidos">
          <Link to="/#performance-lab" className="header-shortcut-link">
            Buscar por objetivo
          </Link>
          <Link to="/#stacks-combos" className="header-shortcut-link">
            Selecciones
          </Link>
          <Link to="/#ofertas-del-mes" className="header-shortcut-link">
            Ediciones
          </Link>
        </div>
      </div>
    </header>
  )
}

export default StoreHeader
