import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useStorefrontUi } from '../../context/StorefrontUiContext'
import { formatCurrency } from '../../lib/currency'
import type { Product } from '../../types/catalog'

type ProductCardProps = {
  product: Product
  variant?: 'default' | 'catalog'
}

function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { addToCart, getAvailableStock } = useCart()
  const { openCartDrawer, openQuickView } = useStorefrontUi()
  const availableStock = getAvailableStock(product.id)
  const isCatalogVariant = variant === 'catalog'
  const quickFacts = [
    availableStock > 0 ? `Stock ${availableStock}` : 'Agotado',
    product.previousPrice ? 'Edicion especial' : 'Precio actual',
  ]
  const heroGoals = product.goals.slice(0, 2)
  const savings =
    product.previousPrice && product.previousPrice > product.price
      ? product.previousPrice - product.price
      : 0

  const handleAddToCart = () => {
    const wasAdded = addToCart(product)

    if (!wasAdded) {
      return
    }

    openCartDrawer()
  }

  return (
    <article
      className={['product-card', isCatalogVariant ? 'product-card-catalog' : 'product-card-default']
        .filter(Boolean)
        .join(' ')}
    >
      <div className="product-image-wrap">
        <img src={product.image} alt={product.name} className="product-image" />
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        <button
          type="button"
          className="product-quick-view-trigger"
          onClick={() => openQuickView(product)}
        >
          Vista rapida
        </button>
        {isCatalogVariant ? (
          <div className="product-floating-meta">
            <span>{product.category}</span>
            <strong>{product.brand}</strong>
          </div>
        ) : null}
      </div>

      <div className="product-content">
        <div className="product-topline">
          <p className="product-meta">
            {product.brand} - {product.category}
          </p>
          <div className="product-tags">
            {quickFacts.map((fact) => (
              <span key={fact} className="product-tag">
                {fact}
              </span>
            ))}
          </div>
        </div>
        <h3>{product.name}</h3>

        {heroGoals.length > 0 ? (
          <div
            className={[
              'product-goal-pills',
              isCatalogVariant ? '' : 'product-goal-pills-default',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {heroGoals.map((goal) => (
              <span key={goal} className="product-goal-pill">
                {goal}
              </span>
            ))}
          </div>
        ) : null}

        <p className="product-description">{product.description}</p>

        {isCatalogVariant && product.features[0] ? (
          <p className="product-feature-callout">
            <span>Detalle</span>
            {product.features[0]}
          </p>
        ) : null}

        <p className="product-stock-copy">
          {availableStock > 0
            ? `${availableStock} unidades disponibles para envio inmediato`
            : 'Producto agotado por el momento'}
        </p>

        <div className="price-row">
          <div className="price-stack">
            <strong>{formatCurrency(product.price)}</strong>
            {product.previousPrice ? <span>{formatCurrency(product.previousPrice)}</span> : null}
          </div>
          {isCatalogVariant && savings > 0 ? (
            <small className="product-discount-note">Ahorras {formatCurrency(savings)}</small>
          ) : null}
        </div>

        <div className="product-actions">
          <button
            className="primary-link button-link"
            type="button"
            onClick={handleAddToCart}
            disabled={availableStock <= 0}
          >
            {availableStock <= 0 ? 'Sin stock' : 'Agregar al carrito'}
          </button>
          <button
            className="secondary-link button-link"
            type="button"
            onClick={() => openQuickView(product)}
          >
            Vista rapida
          </button>
          <Link to={`/producto/${product.slug}`} className="secondary-link">
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
