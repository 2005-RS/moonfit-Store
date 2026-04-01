import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageIntro from '../../components/shared/PageIntro'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCommerce } from '../../context/CommerceContext'
import { useStorefrontUi } from '../../context/StorefrontUiContext'
import { formatCurrency } from '../../lib/currency'
import {
  addFavoriteProduct,
  fetchFavoriteProducts,
  removeFavoriteProduct,
} from '../../lib/customerApi'

function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin } = useAuth()
  const { addToCart, isInCart, getAvailableStock } = useCart()
  const { products } = useCommerce()
  const { openCartDrawer } = useStorefrontUi()
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const product = products.find((item) => item.slug === slug)
  const productFeatures = product?.features.length
    ? product.features
    : ['Seleccion Moonfit', 'Entrega coordinada', 'Acompanamiento por WhatsApp']

  useEffect(() => {
    if (!isAuthenticated || isAdmin) {
      setFavoriteIds([])
      return
    }

    void (async () => {
      const favorites = await fetchFavoriteProducts()
      setFavoriteIds(favorites.map((favorite) => favorite.id))
    })()
  }, [isAdmin, isAuthenticated])

  if (!product) {
    return (
      <main className="page-shell">
        <PageIntro
          eyebrow="Producto"
          title="Producto no encontrado"
          description="La ruta existe, pero no encontramos una pieza asociada a ese identificador."
        />
      </main>
    )
  }

  const handleAddToCart = () => {
    const wasAdded = addToCart(product)

    if (wasAdded) {
      openCartDrawer()
    }
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || isAdmin) {
      navigate('/cuenta')
      return
    }

    if (favoriteIds.includes(product.id)) {
      await removeFavoriteProduct(product.id)
      setFavoriteIds((current) => current.filter((id) => id !== product.id))
      return
    }

    await addFavoriteProduct(product.id)
    setFavoriteIds((current) => [...current, product.id])
  }

  return (
    <main className="page-shell">
      <section className="product-breadcrumbs">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <Link to="/catalogo">Catalogo</Link>
        <span>/</span>
        <strong>{product.name}</strong>
      </section>

      <section className="detail-layout">
        <div className="detail-image-card">
          <img src={product.image} alt={product.name} className="detail-image" />
        </div>

        <div className="detail-content">
          <div className="detail-header-row">
            <p className="eyebrow">{product.category}</p>
            {product.badge ? <span className="detail-badge">{product.badge}</span> : null}
          </div>
          <h1>{product.name}</h1>
          <p className="hero-text">{product.description}</p>
          <p className="product-meta detail-meta">
            {product.brand} | Referencia {product.slug.toUpperCase()}
          </p>

          {product.goals.length > 0 ? (
            <div className="hero-actions">
              {product.goals.map((goal) => (
                <span key={goal} className="filter-chip filter-chip-active">
                  {goal}
                </span>
              ))}
            </div>
          ) : null}

          <div className="price-row detail-price">
            <strong>{formatCurrency(product.price)}</strong>
            {product.previousPrice ? <span>{formatCurrency(product.previousPrice)}</span> : null}
          </div>

          <div className="detail-trust-row">
            <div className="stock-pill">Disponibilidad actual: {product.stock} unidades</div>
            <div className="detail-trust-card">
              <span>Entrega</span>
              <strong>24-48 horas</strong>
            </div>
            <div className="detail-trust-card">
              <span>Pago</span>
              <strong>Protegido y flexible</strong>
            </div>
          </div>

          <ul className="feature-list">
            {productFeatures.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>

          <div className="hero-actions">
            <button
              className="primary-link button-link"
              type="button"
              onClick={handleAddToCart}
              disabled={getAvailableStock(product.id) <= 0}
            >
              {getAvailableStock(product.id) <= 0
                ? 'Sin stock'
                : isInCart(product.id)
                  ? 'Agregar una mas'
                  : 'Agregar al carrito'}
            </button>
            <button
              className="secondary-link button-link"
              type="button"
              onClick={() => void handleToggleFavorite()}
            >
              {favoriteIds.includes(product.id)
                ? 'Quitar de favoritos'
                : 'Guardar en favoritos'}
            </button>
            <Link to="/catalogo" className="secondary-link">
              Volver al catalogo
            </Link>
          </div>
        </div>
      </section>

      <section className="store-section detail-support-grid">
        <article className="detail-support-card">
          <p className="eyebrow">Compra serena</p>
          <h2>Un cierre claro, sin pasos innecesarios</h2>
          <p>
            Agrega a tu seleccion, confirma el pedido y sigue el proceso desde
            una experiencia clara, sobria y facil de seguir.
          </p>
        </article>
        <article className="detail-support-card">
          <p className="eyebrow">Eleccion informada</p>
          <h2>Beneficios visibles segun tu ritmo, objetivo o forma de entrenar</h2>
          <p>
            Consulta metas de uso, guarda la pieza en favoritos y vuelve a ella
            con facilidad cuando la necesites de nuevo.
          </p>
        </article>
      </section>

      <div className="detail-sticky-bar" role="region" aria-label="Compra rapida">
        <div className="detail-sticky-copy">
          <span>{product.category}</span>
          <strong>{product.name}</strong>
          <small>
            {getAvailableStock(product.id) > 0
              ? `${getAvailableStock(product.id)} unidades listas para entrega`
              : 'Sin stock por ahora'}
          </small>
        </div>

        <div className="detail-sticky-price">
          <strong>{formatCurrency(product.price)}</strong>
          {product.previousPrice ? <span>{formatCurrency(product.previousPrice)}</span> : null}
        </div>

        <div className="detail-sticky-actions">
          <button
            className="primary-link button-link"
            type="button"
            onClick={handleAddToCart}
            disabled={getAvailableStock(product.id) <= 0}
          >
            {getAvailableStock(product.id) <= 0
              ? 'Sin stock'
              : isInCart(product.id)
                ? 'Agregar otra'
                : 'Agregar al carrito'}
          </button>
          <button
            className="secondary-link button-link"
            type="button"
            onClick={() => void handleToggleFavorite()}
          >
            {favoriteIds.includes(product.id) ? 'Favorito guardado' : 'Guardar'}
          </button>
        </div>
      </div>
    </main>
  )
}

export default ProductDetailPage
