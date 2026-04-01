import { formatCurrency } from '../../lib/currency'
import type { CustomerOrder } from '../../types/catalog'

type PurchaseTicketCardProps = {
  order: CustomerOrder
  onPrint: () => void
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PROCESSING: 'En preparacion',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

function formatTicketDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getProductLineDetail(order: CustomerOrder['items'][number]) {
  const description = order.product.description.trim()

  if (description) {
    return description
  }

  return [order.product.brand, order.product.category].filter(Boolean).join(' / ')
}

function PurchaseTicketCard({ order, onPrint }: PurchaseTicketCardProps) {
  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const statusLabel = statusLabels[order.status] ?? order.status
  const paymentTypeLabel =
    order.paymentType === 'CREDIT' ? 'Credito aprobado' : 'Pago inmediato'
  const customerContact = [order.customerEmail, order.customerPhone]
    .filter(Boolean)
    .join(' / ')

  return (
    <article className="purchase-ticket-card">
      <header className="purchase-ticket-head">
        <div className="purchase-ticket-brand">
          <p className="eyebrow">Ticket Moonfit</p>
          <h2>Comprobante de compra</h2>
          <p>
            Gracias por tu compra y por ayudarnos a seguir creciendo junto a ti.
          </p>
        </div>

        <div className="purchase-ticket-stamp">
          <span>Orden</span>
          <strong>{order.orderNumber}</strong>
          <small>{formatTicketDate(order.createdAt)}</small>
          <small>Estado: {statusLabel}</small>
        </div>
      </header>

      <section className="purchase-ticket-overview">
        <article className="purchase-ticket-meta-card">
          <span>Cliente</span>
          <strong>{order.customerName}</strong>
          <small>{customerContact}</small>
        </article>

        <article className="purchase-ticket-meta-card">
          <span>Entrega</span>
          <strong>{order.customerCity || 'Por coordinar'}</strong>
          <small>{paymentTypeLabel}</small>
        </article>

        <article className="purchase-ticket-meta-card">
          <span>Metodo</span>
          <strong>{order.paymentMethod}</strong>
          <small>{order.items.length} lineas registradas</small>
        </article>

        <article className="purchase-ticket-meta-card">
          <span>Resumen</span>
          <strong>{totalUnits} unidades</strong>
          <small>Total confirmado: {formatCurrency(order.total)}</small>
        </article>
      </section>

      <section className="purchase-ticket-lines">
        <div className="purchase-ticket-lines-head">
          <div>
            <span>Detalle de compra</span>
            <strong>Productos confirmados en esta orden</strong>
          </div>
        </div>

        <div className="purchase-ticket-table-wrap">
          <table className="purchase-ticket-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Unitario</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.product.name}</strong>
                    <p>{getProductLineDetail(item)}</p>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {order.notes ? (
        <div className="purchase-ticket-note">
          <span>Indicaciones</span>
          <p>{order.notes}</p>
        </div>
      ) : null}

      <footer className="purchase-ticket-footer">
        <div className="purchase-ticket-support-copy">
          <span>Resumen Moonfit</span>
          <p>
            Este comprobante conserva la informacion esencial de la compra para
            seguimiento, entrega y control del pedido.
          </p>
        </div>

        <div className="purchase-ticket-totals">
          <div className="purchase-ticket-total-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(order.subtotal)}</strong>
          </div>
          <div className="purchase-ticket-total-row">
            <span>Envio</span>
            <strong>{formatCurrency(order.shipping)}</strong>
          </div>
          <div className="purchase-ticket-total-row purchase-ticket-total-row-grand">
            <span>Total</span>
            <strong>{formatCurrency(order.total)}</strong>
          </div>
        </div>

        <div className="purchase-ticket-actions">
          <button className="primary-link button-link" type="button" onClick={onPrint}>
            Imprimir ticket
          </button>
          <small>Tambien puedes guardarlo como PDF desde la impresion del navegador.</small>
        </div>
      </footer>
    </article>
  )
}

export default PurchaseTicketCard
