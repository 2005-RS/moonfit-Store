import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useStorefrontUi } from '../../context/StorefrontUiContext'
import { formatCurrency } from '../../lib/currency'

function QuickViewModal() {
  const { quickViewProduct: product, closeQuickView, openCartDrawer } = useStorefrontUi()
  const { addToCart, getAvailableStock, isInCart } = useCart()

  if (!product) {
    return null
  }

  const availableStock = getAvailableStock(product.id)
  const hasDiscount =
    typeof product.previousPrice === 'number' && product.previousPrice > product.price
  const savings = hasDiscount ? product.previousPrice - product.price : 0
  const featureList =
    product.features.length > 0
      ? product.features.slice(0, 3)
      : ['Entrega coordinada', 'Compra guiada por objetivo', 'Soporte por WhatsApp']

  const handleAddToCart = () => {
    const wasAdded = addToCart(product)

    if (!wasAdded) {
      return
    }

    closeQuickView()
    openCartDrawer()
  }

  return (
    <div className="storefront-overlay-shell" role="presentation">
      <button
        type="button"
        className="storefront-backdrop"
        aria-label="Cerrar vista rapida"
        onClick={closeQuickView}
      />

      <section
        className="quick-view-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
      >
        <div className="quick-view-media">
          <img src={product.image} alt={product.name} className="quick-view-image" />
          {product.badge ? <span className="quick-view-badge">{product.badge}</span> : null}
          {hasDiscount ? (
            <span className="quick-view-saving">Ahorras {formatCurrency(savings)}</span>
          ) : null}
        </div>

        <div className="quick-view-body">
          <div className="quick-view-topline">
            <div>
              <p className="eyebrow">{product.category}</p>
              <h2 id="quick-view-title">{product.name}</h2>
            </div>
            <button
              type="button"
              className="quick-view-close"
              aria-label="Cerrar vista rapida"
              onClick={closeQuickView}
            >
              x
            </button>
          </div>

          <p className="product-meta detail-meta">
            {product.brand} | Referencia {product.slug.toUpperCase()}
          </p>
          <p className="quick-view-description">{product.description}</p>

          {product.goals.length > 0 ? (
            <div className="quick-view-goals">
              {product.goals.slice(0, 3).map((goal) => (
                <span key={goal} className="product-goal-pill">
                  {goal}
                </span>
              ))}
            </div>
          ) : null}

          <div className="quick-view-feature-grid">
            {featureList.map((feature) => (
              <article key={feature} className="quick-view-feature-card">
                <span>Detalle</span>
                <strong>{feature}</strong>
              </article>
            ))}
          </div>

          <div className="quick-view-footer">
            <div className="price-row detail-price">
              <strong>{formatCurrency(product.price)}</strong>
              {product.previousPrice ? (
                <span>{formatCurrency(product.previousPrice)}</span>
              ) : null}
            </div>

            <div className="quick-view-stock-row">
              <span>
                {availableStock > 0
                  ? `${availableStock} unidades disponibles`
                  : 'Sin stock por ahora'}
              </span>
              <strong>
                {isInCart(product.id) ? 'Ya esta en tu carrito' : 'Lista para explorar'}
              </strong>
            </div>

            <div className="quick-view-actions">
              <button
                type="button"
                className="primary-link button-link"
                onClick={handleAddToCart}
                disabled={availableStock <= 0}
              >
                {availableStock <= 0 ? 'Sin stock' : 'Agregar y revisar carrito'}
              </button>
              <Link
                to={`/producto/${product.slug}`}
                className="secondary-link"
                onClick={closeQuickView}
              >
                Ver detalle completo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default QuickViewModal
