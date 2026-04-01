import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/catalog/ProductCard'
import PageIntro from '../../components/shared/PageIntro'
import { useCommerce } from '../../context/CommerceContext'
import { featuredCategories } from '../../data/catalogData'
import { formatCurrency } from '../../lib/currency'

type CountOption = {
  label: string
  count: number
}

type ActiveFilter = {
  id: string
  label: string
  clear: () => void
}

const sortOptions = [
  { value: 'featured', label: 'Orden recomendado' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'stock', label: 'Mayor disponibilidad' },
]

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

function isMeaningfulGoal(value: string) {
  return normalizeSearchValue(value).length >= 3
}

function CatalogPage() {
  const { products } = useCommerce()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [activeGoal, setActiveGoal] = useState('Todos')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [showOnlyOffers, setShowOnlyOffers] = useState(false)
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [selectedPriceCap, setSelectedPriceCap] = useState<number | null>(null)
  const deferredQuery = useDeferredValue(query)

  const prices = useMemo(() => products.map((product) => product.price), [products])
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0
  const priceStep =
    highestPrice > lowestPrice
      ? Math.max(500, Math.round((highestPrice - lowestPrice) / 20 / 100) * 100)
      : 500
  const effectivePriceCap = selectedPriceCap ?? highestPrice
  const sliderMax = highestPrice || lowestPrice || 1

  const categories = useMemo(() => {
    const productCategories = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    )

    const orderedKnownCategories = featuredCategories.filter(
      (category) => category !== 'Ofertas' && productCategories.includes(category),
    )
    const remainingCategories = productCategories
      .filter((category) => !orderedKnownCategories.includes(category))
      .sort()

    return ['Todos', 'Ofertas', ...orderedKnownCategories, ...remainingCategories]
  }, [products])

  useEffect(() => {
    const requestedCategory = searchParams.get('categoria')?.trim()
    const nextCategory =
      requestedCategory && categories.includes(requestedCategory)
        ? requestedCategory
        : 'Todos'
    const nextShowOnlyOffers = searchParams.get('promociones') === '1'

    setActiveCategory((currentCategory) =>
      currentCategory === nextCategory ? currentCategory : nextCategory,
    )
    setShowOnlyOffers((currentValue) =>
      currentValue === nextShowOnlyOffers ? currentValue : nextShowOnlyOffers,
    )
  }, [categories, searchParams])

  const categoryCounts = useMemo<CountOption[]>(
    () =>
      categories.map((category) => ({
        label: category,
        count:
          category === 'Todos'
            ? products.length
            : category === 'Ofertas'
              ? products.filter((product) => product.previousPrice).length
              : products.filter((product) => product.category === category).length,
      })),
    [categories, products],
  )

  const goalCounts = useMemo<CountOption[]>(() => {
    const counters = new Map<string, number>()

    products.forEach((product) => {
      product.goals.filter(isMeaningfulGoal).forEach((goal) => {
        counters.set(goal, (counters.get(goal) ?? 0) + 1)
      })
    })

    return [
      { label: 'Todos', count: products.length },
      ...Array.from(counters.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((left, right) =>
          right.count === left.count
            ? left.label.localeCompare(right.label)
            : right.count - left.count,
        ),
    ]
  }, [products])

  const spotlightCategories = categoryCounts
    .filter((category) => category.label !== 'Todos')
    .slice(0, 4)
  const highlightedGoals = goalCounts.filter((goal) => goal.label !== 'Todos').slice(0, 4)
  const offersCount = categoryCounts.find((category) => category.label === 'Ofertas')?.count ?? 0
  const inStockCount = products.filter((product) => product.stock > 0).length

  const filteredProducts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    const nextProducts = products.filter((product) => {
      const isOffer = Boolean(product.previousPrice)
      const matchesCategory =
        activeCategory === 'Todos' ||
        (activeCategory === 'Ofertas'
          ? isOffer
          : product.category === activeCategory)
      const matchesGoal = activeGoal === 'Todos' || product.goals.includes(activeGoal)
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.brand, product.category, product.description, ...product.goals]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesOffers = !showOnlyOffers || isOffer
      const matchesStock = !showInStockOnly || product.stock > 0
      const matchesPrice = effectivePriceCap <= 0 || product.price <= effectivePriceCap

      return (
        matchesCategory &&
        matchesGoal &&
        matchesQuery &&
        matchesOffers &&
        matchesStock &&
        matchesPrice
      )
    })

    if (sortBy === 'price-asc') {
      return [...nextProducts].sort((left, right) => left.price - right.price)
    }

    if (sortBy === 'price-desc') {
      return [...nextProducts].sort((left, right) => right.price - left.price)
    }

    if (sortBy === 'stock') {
      return [...nextProducts].sort((left, right) => right.stock - left.stock)
    }

    return nextProducts
  }, [
    activeCategory,
    activeGoal,
    deferredQuery,
    effectivePriceCap,
    products,
    showInStockOnly,
    showOnlyOffers,
    sortBy,
  ])

  const pricePresets = useMemo(() => {
    if (!highestPrice || highestPrice <= 0) {
      return []
    }

    const rawPresets = [0.35, 0.55, 0.75].map((ratio) =>
      Math.max(
        lowestPrice || 0,
        Math.min(highestPrice, Math.round((highestPrice * ratio) / 500) * 500),
      ),
    )

    return Array.from(new Set(rawPresets))
      .filter((value) => value > (lowestPrice || 0) && value < highestPrice)
      .map((value) => ({
        label: `Hasta ${formatCurrency(value)}`,
        value,
      }))
  }, [highestPrice, lowestPrice])

  const visibleOffersCount = filteredProducts.filter((product) => product.previousPrice).length
  const visibleInStockCount = filteredProducts.filter((product) => product.stock > 0).length
  const averageVisiblePrice = filteredProducts.length
    ? Math.round(
        filteredProducts.reduce((total, product) => total + product.price, 0) /
          filteredProducts.length,
      )
    : 0
  const visiblePriceFloor = filteredProducts.length
    ? Math.min(...filteredProducts.map((product) => product.price))
    : 0
  const visiblePriceCeiling = filteredProducts.length
    ? Math.max(...filteredProducts.map((product) => product.price))
    : 0
  const inventoryCoverage = filteredProducts.length
    ? Math.round((visibleInStockCount / filteredProducts.length) * 100)
    : 0
  const currentCollection =
    activeCategory === 'Todos' ? 'Catalogo completo' : activeCategory
  const currentGoal =
    activeGoal === 'Todos' ? 'Exploracion abierta' : activeGoal
  const resultsHeadline =
    filteredProducts.length > 0
      ? activeGoal === 'Todos'
        ? `${filteredProducts.length} opciones para explorar`
        : `${filteredProducts.length} opciones para ${activeGoal.toLowerCase()}`
      : 'No encontramos coincidencias'
  const featuredProduct =
    filteredProducts.find((product) => product.previousPrice) ??
    filteredProducts[0] ??
    products.find((product) => product.previousPrice) ??
    products[0]
  const featuredProductGoal =
    featuredProduct?.goals.find(isMeaningfulGoal) ?? currentGoal

  const activeFilters: ActiveFilter[] = []

  if (activeCategory !== 'Todos') {
    activeFilters.push({
      id: 'category',
      label: `Categoria: ${activeCategory}`,
      clear: () => handleCategoryChange('Todos'),
    })
  }

  if (activeGoal !== 'Todos') {
    activeFilters.push({
      id: 'goal',
      label: `Objetivo: ${activeGoal}`,
      clear: () => setActiveGoal('Todos'),
    })
  }

  if (showOnlyOffers) {
    activeFilters.push({
      id: 'offers',
      label: 'Solo ofertas',
      clear: () => handleOffersToggle(false),
    })
  }

  if (showInStockOnly) {
    activeFilters.push({
      id: 'stock',
      label: 'Solo disponibles',
      clear: () => setShowInStockOnly(false),
    })
  }

  if (deferredQuery.trim()) {
    activeFilters.push({
      id: 'query',
      label: `Busqueda: ${deferredQuery.trim()}`,
      clear: () => setQuery(''),
    })
  }

  if (selectedPriceCap !== null && selectedPriceCap < highestPrice) {
    activeFilters.push({
      id: 'price',
      label: `Hasta ${formatCurrency(effectivePriceCap)}`,
      clear: () => setSelectedPriceCap(null),
    })
  }

  const hasActiveFilters = activeFilters.length > 0

  const syncCatalogQuery = (nextCategory: string, nextShowOnlyOffers: boolean) => {
    const nextSearchParams = new URLSearchParams(searchParams)

    if (nextCategory !== 'Todos') {
      nextSearchParams.set('categoria', nextCategory)
    } else {
      nextSearchParams.delete('categoria')
    }

    if (nextShowOnlyOffers) {
      nextSearchParams.set('promociones', '1')
    } else {
      nextSearchParams.delete('promociones')
    }

    setSearchParams(nextSearchParams, { replace: true })
  }

  const handleCategoryChange = (nextCategory: string) => {
    setActiveCategory(nextCategory)
    syncCatalogQuery(nextCategory, showOnlyOffers)
  }

  const handleCategoryToggle = (categoryLabel: string) => {
    handleCategoryChange(activeCategory === categoryLabel ? 'Todos' : categoryLabel)
  }

  const handleOffersToggle = (nextValue?: boolean) => {
    const resolvedValue = nextValue ?? !showOnlyOffers

    setShowOnlyOffers(resolvedValue)
    syncCatalogQuery(activeCategory, resolvedValue)
  }

  const clearFilters = () => {
    setActiveCategory('Todos')
    setActiveGoal('Todos')
    setQuery('')
    setSortBy('featured')
    setShowOnlyOffers(false)
    setShowInStockOnly(false)
    setSelectedPriceCap(null)
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return (
    <main className="page-shell catalog-page">
      <PageIntro
        eyebrow="Catalogo"
        title="Explora suplementos y accesorios con una mirada mas serena y precisa"
        description="Busca por nombre, combina filtros utiles y compara opciones con una lectura clara y elegante."
      />

      <section className="catalog-experience">
        <div className="catalog-hero-panel">
          <div className="catalog-hero-copy">
            <p className="eyebrow">Descubrimiento guiado</p>
            <h2>Suplementos y accesorios para cada ritmo y objetivo.</h2>
            <p>Explora proteinas, bienestar, accesorios y ofertas en una sola vista armoniosa.</p>
          </div>

          <div className="catalog-search-shell">
            <label className="catalog-search-panel">
              <span>Busca por marca, categoria, objetivo o beneficio</span>
              <div className="catalog-search-panel-inner">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ej. creatina, home gym, recuperacion, NutriForge"
                  className="catalog-search-input"
                />
                {query ? (
                  <button
                    type="button"
                    className="catalog-search-reset"
                    onClick={() => setQuery('')}
                  >
                    Limpiar
                  </button>
                ) : null}
              </div>
            </label>

            <div className="catalog-search-meta">
              <span>
                {deferredQuery.trim()
                  ? `Buscando: "${deferredQuery.trim()}"`
                  : 'Explorando el inventario completo'}
              </span>
              <strong>{filteredProducts.length} productos visibles</strong>
            </div>
          </div>

          <div className="catalog-highlight-row">
            <article className="catalog-highlight-card">
              <span>Coleccion destacada</span>
              <strong>{currentCollection}</strong>
              <p>{currentGoal}</p>
            </article>
            <article className="catalog-highlight-card">
              <span>Precios especiales</span>
              <strong>{visibleOffersCount}</strong>
              <p>{offersCount} piezas con precio especial dentro del inventario</p>
            </article>
            <article className="catalog-highlight-card">
              <span>Precio medio</span>
              <strong>{averageVisiblePrice ? formatCurrency(averageVisiblePrice) : 'Sin datos'}</strong>
              <p>{visibleInStockCount} listos para entrega coordinada</p>
            </article>
          </div>

          <div className="catalog-collection-row">
            {spotlightCategories.map((category) => {
              const isActive = activeCategory === category.label

              return (
                <button
                  key={category.label}
                  type="button"
                  className={[
                    'catalog-collection-card',
                    isActive ? 'catalog-collection-card-active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleCategoryToggle(category.label)}
                >
                  <span>Coleccion</span>
                  <strong>{category.label}</strong>
                  <small>{category.count} productos</small>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="catalog-preview-panel">
          <div className="catalog-preview-badge-row">
            <span className="catalog-preview-badge">Seleccion actual</span>
            {featuredProduct?.previousPrice ? (
              <span className="catalog-preview-badge catalog-preview-badge-accent">
                Precio especial
              </span>
            ) : null}
          </div>

          {featuredProduct ? (
            <>
              <div className="catalog-preview-media">
                <img
                  src={featuredProduct.image}
                  alt={featuredProduct.name}
                  className="catalog-preview-image"
                />
              </div>

              <div className="catalog-preview-body">
                <div>
                  <p className="eyebrow">Pieza destacada</p>
                  <h3>{featuredProduct.name}</h3>
                  <p>
                    {featuredProduct.description} Una pieza afin a la
                    combinacion actual de objetivo, categoria y presupuesto.
                  </p>
                </div>

                <div className="catalog-preview-stats">
                  <article className="catalog-preview-stat">
                    <span>Categoria</span>
                    <strong>{featuredProduct.category}</strong>
                  </article>
                  <article className="catalog-preview-stat">
                    <span>Objetivo</span>
                    <strong>{featuredProductGoal}</strong>
                  </article>
                  <article className="catalog-preview-stat">
                    <span>Precio</span>
                    <strong>{formatCurrency(featuredProduct.price)}</strong>
                  </article>
                  <article className="catalog-preview-stat">
                    <span>Stock</span>
                    <strong>{featuredProduct.stock} unidades</strong>
                  </article>
                </div>

                <div className="catalog-preview-actions">
                  <button
                    type="button"
                    className="secondary-link button-link"
                    onClick={() => handleCategoryChange(featuredProduct.category)}
                  >
                    Ver coleccion
                  </button>
                  <Link to={`/producto/${featuredProduct.slug}`} className="primary-link">
                    Ver detalle
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="catalog-preview-body">
              <p className="eyebrow">Inventario vacio</p>
              <h3>Cuando cargues productos, aqui aparecera una seleccion destacada.</h3>
              <p>La vista lateral mostrara la pieza mas afin a los filtros activos.</p>
            </div>
          )}
        </aside>
      </section>

      {highlightedGoals.length > 0 ? (
        <section className="catalog-goal-deck">
          {highlightedGoals.map((goal) => {
            const isActive = activeGoal === goal.label

            return (
              <button
                key={goal.label}
                type="button"
                className={['catalog-goal-card', isActive ? 'catalog-goal-card-active' : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() =>
                  setActiveGoal((current) => (current === goal.label ? 'Todos' : goal.label))
                }
              >
                <span>Objetivo</span>
                <strong>{goal.label}</strong>
                <small>{goal.count} opciones relacionadas</small>
              </button>
            )
          })}
        </section>
      ) : null}

      <section className="catalog-layout">
        <aside className="catalog-sidebar">
          <div className="catalog-sidebar-card">
            <div className="catalog-sidebar-head">
              <div>
                <p className="eyebrow">Filtros activos</p>
                <h2>Refina tu seleccion</h2>
                <p className="catalog-sidebar-copy">
                  Ajusta presupuesto, disponibilidad y objetivo sin salir de la misma vista.
                </p>
              </div>
              <button className="secondary-link button-link" type="button" onClick={clearFilters}>
                Limpiar todo
              </button>
            </div>

            <label className="catalog-field">
              Orden recomendado
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="catalog-toggle-grid">
              <button
                type="button"
                className={[
                  'catalog-toggle-card',
                  showOnlyOffers ? 'catalog-toggle-card-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleOffersToggle()}
              >
                <span>Ediciones</span>
                <strong>Solo precios especiales</strong>
                <small>{offersCount} disponibles</small>
              </button>
              <button
                type="button"
                className={[
                  'catalog-toggle-card',
                  showInStockOnly ? 'catalog-toggle-card-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setShowInStockOnly((current) => !current)}
              >
                <span>Disponibilidad</span>
                <strong>Solo disponibles</strong>
                <small>{inStockCount} listos para entrega</small>
              </button>
            </div>

            <div className="catalog-range-card">
              <div className="catalog-range-head">
                <div>
                  <span>Presupuesto maximo</span>
                  <strong>{highestPrice ? formatCurrency(effectivePriceCap) : 'Sin productos'}</strong>
                </div>
                {selectedPriceCap !== null ? (
                  <button
                    className="catalog-reset-text"
                    type="button"
                    onClick={() => setSelectedPriceCap(null)}
                  >
                    Restablecer
                  </button>
                ) : null}
              </div>

              <input
                type="range"
                min={lowestPrice}
                max={sliderMax}
                step={priceStep}
                value={selectedPriceCap ?? sliderMax}
                onChange={(event) => setSelectedPriceCap(Number(event.target.value))}
                disabled={products.length === 0 || highestPrice === lowestPrice}
                className="catalog-range-input"
              />

              <div className="catalog-range-values">
                <span>{formatCurrency(lowestPrice)}</span>
                <span>{formatCurrency(highestPrice)}</span>
              </div>

              {pricePresets.length > 0 ? (
                <div className="catalog-price-presets">
                  {pricePresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={[
                        'catalog-price-preset',
                        selectedPriceCap === preset.value ? 'catalog-price-preset-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setSelectedPriceCap(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="catalog-sidebar-section">
              <div className="catalog-section-title">
                <p className="eyebrow">Categorias</p>
                <strong>{activeCategory}</strong>
              </div>
              <div className="catalog-option-list">
                {categoryCounts.map((category) => {
                  const isActive = activeCategory === category.label

                  return (
                    <button
                      key={category.label}
                      type="button"
                      className={[
                        'catalog-option-button',
                        isActive ? 'catalog-option-button-active' : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleCategoryToggle(category.label)}
                    >
                      <span>{category.label}</span>
                      <small>{category.count}</small>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="catalog-sidebar-section">
              <div className="catalog-section-title">
                <p className="eyebrow">Objetivos</p>
                <strong>{activeGoal}</strong>
              </div>
              <div className="catalog-chip-list">
                {goalCounts.map((goal) => {
                  const isActive = activeGoal === goal.label

                  return (
                    <button
                      key={goal.label}
                      type="button"
                      className={[
                        'catalog-chip-button',
                        isActive ? 'catalog-chip-button-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() =>
                        setActiveGoal((current) =>
                          current === goal.label ? 'Todos' : goal.label,
                        )
                      }
                    >
                      {goal.label}
                      <small>{goal.count}</small>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="catalog-tip-card">
              <span>Sugerencia</span>
              <strong>Combina objetivo y presupuesto para llegar a una seleccion mas afinada.</strong>
              <p>
                Es una forma simple de descubrir piezas utiles sin perder de vista precios especiales ni disponibilidad.
              </p>
            </div>
          </div>
        </aside>

        <section className="catalog-results-panel">
          <div className="catalog-results-header">
            <div>
              <p className="eyebrow">Resultados</p>
              <h2>
                {resultsHeadline}
              </h2>
              <p>
                {hasActiveFilters
                  ? 'Estas viendo una seleccion afinada segun tus criterios actuales.'
                  : 'Explora el inventario visible y usa los filtros para perfilar tu busqueda con calma.'}
              </p>
            </div>

            <div className="catalog-results-meta">
              <span>
                {sortOptions.find((option) => option.value === sortBy)?.label ?? 'Orden recomendado'}
              </span>
              <strong>{activeFilters.length} filtros activos</strong>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="catalog-active-filters">
              {activeFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className="catalog-active-filter"
                  onClick={filter.clear}
                >
                  <span>{filter.label}</span>
                  <strong>x</strong>
                </button>
              ))}
            </div>
          ) : (
            <div className="catalog-empty-hint">
              <span>Sugerencia</span>
              <p>
                Empieza por un objetivo y luego ajusta el presupuesto para descubrir
                una seleccion mas precisa.
              </p>
            </div>
          )}

          <div className="catalog-results-story">
            <article className="catalog-story-card">
              <span>Cobertura de stock</span>
              <strong>{inventoryCoverage}% de la seleccion visible esta disponible</strong>
              <p>
                {visibleInStockCount} productos listos para pasar a tu seleccion dentro de esta
                vista.
              </p>
            </article>
            <article className="catalog-story-card">
              <span>Rango visible</span>
              <strong>
                {filteredProducts.length > 0
                  ? `${formatCurrency(visiblePriceFloor)} - ${formatCurrency(visiblePriceCeiling)}`
                  : 'Sin resultados'}
              </strong>
              <p>
                {filteredProducts.length > 0
                  ? 'Compara con calma entre opciones esenciales y ediciones mas completas sin salir de la grilla.'
                  : 'Prueba limpiando filtros o ampliando el rango para volver a descubrir productos.'}
              </p>
            </article>
          </div>

          {filteredProducts.length > 0 ? (
            <section className="catalog-product-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} variant="catalog" />
              ))}
            </section>
          ) : (
            <section className="store-section empty-results">
              <div className="section-heading">
                <p className="eyebrow">Sin resultados</p>
                <h2>No encontramos productos para esa combinacion</h2>
                <p>
                  Ajusta el presupuesto, cambia el objetivo o limpia filtros para volver a una
                  vista mas amplia y ligera del catalogo.
                </p>
              </div>
              <div className="hero-actions">
                <button className="primary-link button-link" type="button" onClick={clearFilters}>
                  Limpiar filtros
                </button>
                <button
                  className="secondary-link button-link"
                  type="button"
                  onClick={() => setActiveGoal('Todos')}
                >
                  Ver todos los objetivos
                </button>
              </div>
            </section>
          )}
        </section>
      </section>
    </main>
  )
}

export default CatalogPage
