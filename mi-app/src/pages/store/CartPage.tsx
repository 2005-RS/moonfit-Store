import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import PurchaseTicketCard from '../../components/cart/PurchaseTicketCard'
import PageIntro from '../../components/shared/PageIntro'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCommerce } from '../../context/CommerceContext'
import { DEFAULT_SHIPPING_CRC, formatCurrency } from '../../lib/currency'
import type { CustomerOrder, Product } from '../../types/catalog'

const baseShipping = DEFAULT_SHIPPING_CRC

type CheckoutFormState = {
  name: string
  email: string
  phone: string
  city: string
  paymentMethod: string
  notes: string
}

const emptyCheckoutForm: CheckoutFormState = {
  name: '',
  email: '',
  phone: '',
  city: '',
  paymentMethod: 'Tarjeta',
  notes: '',
}

const reassuranceCards = [
  {
    title: 'Revision serena',
    description: 'Ajusta cantidades y detalles antes de confirmar sin perder claridad.',
  },
  {
    title: 'Cierre transparente',
    description: 'Ves subtotal, envio y total final antes de completar tu pedido.',
  },
  {
    title: 'Seguimiento claro',
    description: 'Al confirmar, recibes un ticket con el detalle completo de tu compra.',
  },
]

function truncateProductDescription(product: Product) {
  const normalizedDescription = product.description.trim()

  if (normalizedDescription.length <= 148) {
    return normalizedDescription
  }

  return `${normalizedDescription.slice(0, 145)}...`
}

function formatPaymentMethodLabel(value: string) {
  return value.toLowerCase() === 'credito' ? 'Credito aprobado' : value
}

function formatOrderStatusLabel(value: string) {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    PAID: 'Pagado',
    PROCESSING: 'En preparacion',
    SHIPPED: 'En camino',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  }

  return labels[value] ?? value
}

function CartPage() {
  const {
    items,
    subtotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    getAvailableStock,
  } = useCart()
  const { profile } = useAuth()
  const { createOrder, error: commerceError } = useCommerce()
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>(emptyCheckoutForm)
  const [createdOrder, setCreatedOrder] = useState<CustomerOrder | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const isCreditPayment = checkoutForm.paymentMethod.toLowerCase() === 'credito'
  const shipping = items.length > 0 && !isCreditPayment ? baseShipping : 0
  const total = subtotal + (items.length > 0 ? shipping : 0)
  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  useEffect(() => {
    if (!profile?.customer) {
      return
    }

    setCheckoutForm((current) => ({
      ...current,
      name: current.name || profile.customer?.name || '',
      email: current.email || profile.email || '',
      phone: current.phone || profile.customer?.phone || '',
      city: current.city || profile.customer?.city || '',
    }))
  }, [profile])

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setCheckoutForm((current) => ({ ...current, [name]: value }))
  }

  const handlePrintTicket = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (items.length === 0) {
      return
    }

    const hasInvalidStock = items.some(
      (item) => item.quantity > getAvailableStock(item.product.id),
    )

    if (hasInvalidStock) {
      setErrorMessage(
        'Algunas piezas ya no tienen disponibilidad suficiente. Ajusta el carrito antes de continuar.',
      )
      return
    }

    void (async () => {
      try {
        const order = await createOrder({
          customer: checkoutForm,
          items,
          shipping,
          total,
          notes: checkoutForm.notes,
        })
        setCreatedOrder(order)
        clearCart()
        setCheckoutForm(emptyCheckoutForm)
        setErrorMessage('')
      } catch (requestError) {
        setErrorMessage(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo confirmar el pedido.',
        )
      }
    })()
  }

  if (createdOrder && items.length === 0) {
    return (
      <main className="page-shell cart-page">
        <PageIntro
          eyebrow="Compra confirmada"
          title="Tu ticket ya esta listo"
          description="La compra quedo registrada con todo el detalle para que puedas guardarlo, imprimirlo o retomarlo con facilidad."
        />

        <section className="cart-confirmation-layout">
          <article className="summary-card cart-confirmation-card">
            <p className="eyebrow">Moonfit</p>
            <h2>Gracias por comprar con nosotros</h2>
            <p>
              Tu pedido <strong>{createdOrder.orderNumber}</strong> fue recibido y ya
              cuenta con un comprobante completo. Conserva este ticket para cualquier
              seguimiento o coordinacion.
            </p>

            <div className="cart-confirmation-stats">
              <article className="cart-confirmation-stat">
                <span>Total</span>
                <strong>{formatCurrency(createdOrder.total)}</strong>
                <small>Resumen final de tu compra</small>
              </article>
              <article className="cart-confirmation-stat">
                <span>Pago</span>
                <strong>{formatPaymentMethodLabel(createdOrder.paymentMethod)}</strong>
                <small>{formatOrderStatusLabel(createdOrder.status)}</small>
              </article>
              <article className="cart-confirmation-stat">
                <span>Entrega</span>
                <strong>{createdOrder.customerCity || 'Por coordinar'}</strong>
                <small>{createdOrder.items.length} lineas confirmadas</small>
              </article>
            </div>

            <div className="cart-next-steps">
              <article className="cart-next-step">
                <strong>Conserva tu numero de orden</strong>
                <p>Te ayudara a ubicar el pedido y acelerar cualquier consulta.</p>
              </article>
              <article className="cart-next-step">
                <strong>Guarda el ticket</strong>
                <p>Puedes imprimirlo o guardarlo en PDF desde el navegador.</p>
              </article>
              <article className="cart-next-step">
                <strong>Vuelve cuando quieras</strong>
                <p>Tu experiencia queda lista para seguir explorando el catalogo.</p>
              </article>
            </div>

            <div className="hero-actions">
              <Link to="/catalogo" className="primary-link">
                Seguir explorando
              </Link>
              <Link to="/mi-cuenta" className="secondary-link">
                Ver mi cuenta
              </Link>
            </div>
          </article>

          <PurchaseTicketCard order={createdOrder} onPrint={handlePrintTicket} />
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell cart-page">
      <PageIntro
        eyebrow="Carrito Moonfit"
        title={
          items.length > 0
            ? 'Un cierre de compra claro y elegante'
            : 'Tu proxima seleccion puede empezar aqui'
        }
        description={
          items.length > 0
            ? 'Revisa cada pieza, afina cantidades y completa tu compra desde una experiencia mas pulida y amable.'
            : 'Cuando vuelvas a elegir productos, este espacio reunira tu resumen, datos de compra y ticket final en un solo lugar.'
        }
      />

      <section className="cart-layout checkout-layout cart-experience">
        <div className="cart-items-card cart-collection-card">
          {items.length === 0 ? (
            <div className="empty-cart cart-empty-state">
              <p className="eyebrow">Seleccion vacia</p>
              <h2>Tu carrito espera una nueva eleccion</h2>
              <p>
                Vuelve al catalogo para sumar suplementos o accesorios. Cuando lo hagas,
                aqui veras un resumen cuidado, claro y listo para cerrar la compra.
              </p>
              <div className="hero-actions">
                <Link to="/catalogo" className="primary-link">
                  Ir al catalogo
                </Link>
                <Link to="/" className="secondary-link">
                  Volver al inicio
                </Link>
              </div>
            </div>
          ) : (
            <>
              <header className="cart-collection-head">
                <div>
                  <p className="eyebrow">Seleccion actual</p>
                  <h2>Todo listo para un cierre de compra mas sereno</h2>
                  <p>
                    Tu carrito reúne cada producto con contexto, cantidades claras y un
                    resumen visual pensado para decidir con tranquilidad.
                  </p>
                </div>

                <div className="cart-collection-pills">
                  <span>{items.length} productos distintos</span>
                  <span>{totalUnits} unidades</span>
                  <span>{formatCurrency(subtotal)} en piezas seleccionadas</span>
                </div>
              </header>

              <div className="cart-overview-grid">
                <article className="cart-overview-card">
                  <span>Piezas seleccionadas</span>
                  <strong>{items.length}</strong>
                  <small>Todo en una sola vista antes de pagar.</small>
                </article>
                <article className="cart-overview-card">
                  <span>Subtotal actual</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                  <small>Sin sorpresas antes de la confirmacion.</small>
                </article>
                <article className="cart-overview-card">
                  <span>Envio estimado</span>
                  <strong>{formatCurrency(shipping)}</strong>
                  <small>El credito mantiene envio en cero.</small>
                </article>
              </div>

              <div className="cart-items-stack">
                {items.map((item) => (
                  <article className="cart-item cart-item-refined" key={item.product.id}>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="cart-thumb"
                    />

                    <div className="cart-item-copy">
                      <div className="cart-item-topline">
                        <div>
                          <p className="product-meta">
                            {item.product.brand} · {item.product.category}
                          </p>
                          <h3>{item.product.name}</h3>
                        </div>
                        <strong className="cart-line-total">
                          {formatCurrency(item.product.price * item.quantity)}
                        </strong>
                      </div>

                      <p className="cart-item-description">
                        {truncateProductDescription(item.product)}
                      </p>

                      {item.product.goals.length > 0 ? (
                        <div className="cart-item-tags">
                          {item.product.goals.slice(0, 3).map((goal) => (
                            <span key={`${item.product.id}-${goal}`}>{goal}</span>
                          ))}
                        </div>
                      ) : null}

                      <div className="cart-item-footer">
                        <div className="quantity-controls">
                          <button
                            className="quantity-button"
                            type="button"
                            onClick={() => decreaseQuantity(item.product.id)}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            className="quantity-button"
                            type="button"
                            onClick={() => {
                              const wasIncreased = increaseQuantity(item.product.id)

                              if (!wasIncreased) {
                                setErrorMessage(
                                  `No puedes agregar mas unidades de ${item.product.name} porque ya alcanzaste el stock disponible.`,
                                )
                              } else {
                                setErrorMessage('')
                              }
                            }}
                            disabled={item.quantity >= getAvailableStock(item.product.id)}
                          >
                            +
                          </button>
                          <button
                            className="remove-link"
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            Quitar
                          </button>
                        </div>

                        <small className="cart-unit-copy">
                          {formatCurrency(item.product.price)} por unidad
                        </small>
                      </div>

                      {item.quantity >= getAvailableStock(item.product.id) ? (
                        <small className="warning-note">
                          Alcanzaste el maximo disponible para este producto.
                        </small>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="summary-card cart-summary-card">
          <header className="cart-summary-head">
            <div>
              <p className="eyebrow">Resumen de pago</p>
              <h2>Antes de confirmar</h2>
              <p>
                Completa tus datos una sola vez y recibe al final un ticket con el
                detalle total de la compra.
              </p>
            </div>
          </header>

          <div className="cart-summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Envio</span>
              <strong>{formatCurrency(items.length > 0 ? shipping : 0)}</strong>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </div>

          <div className="cart-reassurance-grid">
            {reassuranceCards.map((card) => (
              <article className="cart-reassurance-card" key={card.title}>
                <strong>{card.title}</strong>
                <p>{card.description}</p>
              </article>
            ))}
          </div>

          <form className="product-form checkout-form cart-checkout-form" onSubmit={handleCheckout}>
            <div className="form-row">
              <label>
                Nombre
                <input
                  name="name"
                  value={checkoutForm.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Correo
                <input
                  name="email"
                  type="email"
                  value={checkoutForm.email}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Telefono
                <input
                  name="phone"
                  value={checkoutForm.phone}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Ciudad
                <input
                  name="city"
                  value={checkoutForm.city}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label>
              Metodo de pago
              <select
                name="paymentMethod"
                value={checkoutForm.paymentMethod}
                onChange={handleChange}
              >
                <option value="Tarjeta">Tarjeta</option>
                <option value="SINPE">SINPE</option>
                <option value="Transferencia">Transferencia</option>
                <option value="PayPal">PayPal</option>
                {profile?.customer?.creditApproved ? (
                  <option value="Credito">Credito</option>
                ) : null}
              </select>
            </label>

            <label>
              Nota para la entrega
              <textarea
                name="notes"
                value={checkoutForm.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Ejemplo: horario ideal, referencia de entrega o detalle util para coordinar."
              />
            </label>

            {profile?.customer?.creditApproved ? (
              <p className="info-note">
                Tu cuenta dispone de credito aprobado. Tienes un limite aproximado de{' '}
                {formatCurrency(profile.customer.creditLimit ?? 0)} con un plazo de{' '}
                {profile.customer.creditDays ?? 0} dias. Los pedidos de contado incluyen{' '}
                {formatCurrency(baseShipping)} de envio base y los pedidos a credito no lo agregan.
              </p>
            ) : null}

            {errorMessage || commerceError ? (
              <p className="warning-note">{errorMessage || commerceError}</p>
            ) : null}

            <div className="hero-actions">
              <button
                className="primary-link button-link"
                type="submit"
                disabled={items.length === 0}
              >
                Confirmar pedido
              </button>
              <button
                className="secondary-link button-link"
                type="button"
                onClick={clearCart}
                disabled={items.length === 0}
              >
                Vaciar carrito
              </button>
              <Link to="/catalogo" className="secondary-link">
                Seguir explorando
              </Link>
            </div>
          </form>
        </aside>
      </section>
    </main>
  )
}

export default CartPage
