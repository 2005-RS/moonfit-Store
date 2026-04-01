import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useStorefrontUi } from '../../context/StorefrontUiContext'
import { DEFAULT_SHIPPING_CRC, formatCurrency } from '../../lib/currency'

function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    decreaseQuantity,
    increaseQuantity,
    removeFromCart,
    clearCart,
    getAvailableStock,
  } = useCart()
  const { isCartDrawerOpen, closeCartDrawer } = useStorefrontUi()
  const shipping = items.length > 0 ? DEFAULT_SHIPPING_CRC : 0
  const total = subtotal + shipping

  if (!isCartDrawerOpen) {
    return null
  }

  return (
    <div className="storefront-overlay-shell" role="presentation">
      <button
        type="button"
        className="storefront-backdrop"
        aria-label="Cerrar carrito"
        onClick={closeCartDrawer}
      />

      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <header className="cart-drawer-header">
          <div>
            <p className="eyebrow">Carrito rapido</p>
            <h2 id="cart-drawer-title">Tu seleccion actual</h2>
            <p>{itemCount} productos listos para revisar.</p>
          </div>

          <button
            type="button"
            className="cart-drawer-close"
            aria-label="Cerrar carrito"
            onClick={closeCartDrawer}
          >
            x
          </button>
        </header>

        {items.length > 0 ? (
          <>
            <div className="cart-drawer-list">
              {items.map((item) => {
                const availableStock = getAvailableStock(item.product.id)

                return (
                  <article key={item.product.id} className="cart-drawer-item">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="cart-drawer-item-image"
                    />

                    <div className="cart-drawer-item-body">
                      <div className="cart-drawer-item-top">
                        <div>
                          <p className="cart-drawer-item-meta">
                            {item.product.brand} | {item.product.category}
                          </p>
                          <strong>{item.product.name}</strong>
                        </div>

                        <button
                          type="button"
                          className="cart-drawer-remove"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          Quitar
                        </button>
                      </div>

                      <div className="cart-drawer-item-bottom">
                        <div className="cart-drawer-quantity">
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(item.product.id)}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => increaseQuantity(item.product.id)}
                            disabled={item.quantity >= availableStock}
                          >
                            +
                          </button>
                        </div>

                        <div className="cart-drawer-price">
                          <span>
                            {item.quantity} x {formatCurrency(item.product.price)}
                          </span>
                          <strong>
                            {formatCurrency(item.product.price * item.quantity)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <footer className="cart-drawer-footer">
              <div className="cart-drawer-summary">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div>
                  <span>Envio estimado</span>
                  <strong>{formatCurrency(shipping)}</strong>
                </div>
                <div className="cart-drawer-summary-total">
                  <span>Total estimado</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              </div>

              <div className="cart-drawer-actions">
                <Link
                  to="/carrito"
                  className="primary-link button-link"
                  onClick={closeCartDrawer}
                >
                  Ir al checkout
                </Link>
                <button
                  type="button"
                  className="secondary-link button-link"
                  onClick={closeCartDrawer}
                >
                  Seguir comprando
                </button>
                <button
                  type="button"
                  className="cart-drawer-clear"
                  onClick={clearCart}
                >
                  Vaciar carrito
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="cart-drawer-empty">
            <p className="eyebrow">Aun esta vacio</p>
            <h2>Agrega productos y usa este panel para revisar todo sin salir de la tienda.</h2>
            <p>
              El carrito lateral te ayuda a comparar, ajustar cantidades y seguir
              comprando con una experiencia mas fluida.
            </p>

            <div className="hero-actions">
              <Link
                to="/catalogo"
                className="primary-link"
                onClick={closeCartDrawer}
              >
                Explorar catalogo
              </Link>
              <button
                type="button"
                className="secondary-link button-link"
                onClick={closeCartDrawer}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

export default CartDrawer
