import {
  useDeferredValue,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import PageIntro from '../../components/shared/PageIntro'
import {
  exportOrdersCsv,
  fetchAdminOrders,
  recordOrderPayment,
  runCreditReminders,
} from '../../lib/adminApi'
import { useCommerce } from '../../context/CommerceContext'
import { formatCurrency } from '../../lib/currency'
import type { PaginationMeta } from '../../types/admin'
import type { OrderSummary } from '../../types/catalog'

const statusOptions = ['Todos', 'Pendiente', 'Pagado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado']

type PaymentFormState = {
  amount: string
  paymentMethod: string
  reference: string
  notes: string
}

const emptyPaymentForm: PaymentFormState = {
  amount: '',
  paymentMethod: 'SINPE',
  reference: '',
  notes: '',
}

function formatMoney(value: number) {
  return formatCurrency(value)
}

function getCustomerOrderLabel(order: OrderSummary) {
  return order.orderNumber ?? order.id
}

function getDueMessage(order: OrderSummary) {
  if (order.collectionStatus === 'Vencido') {
    return 'Credito vencido'
  }

  if (order.dueSoon) {
    return `Vence en ${order.daysUntilDue} dia(s)`
  }

  if (order.paymentTypeCode === 'CREDIT' && order.dueDate) {
    return `Vence ${order.dueDate}`
  }

  return 'Sin alerta'
}

function AdminOrdersPage() {
  const { updateOrderStatus, refreshCommerce } = useCommerce()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [selectedStatus, setSelectedStatus] = useState('Todos')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('customerName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(8)
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(emptyPaymentForm)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const deferredSearch = useDeferredValue(search)

  const loadOrders = async () => {
    setIsLoading(true)

    try {
      const response = await fetchAdminOrders({
        page,
        pageSize,
        search: deferredSearch,
        status: selectedStatus === 'Todos' ? undefined : selectedStatus,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortDirection,
      })

      setOrders(response.data)
      setMeta(response.meta)
      setError('')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar los pedidos.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [dateFrom, dateTo, deferredSearch, page, pageSize, selectedStatus, sortBy, sortDirection])

  useEffect(() => {
    setPage(1)
  }, [dateFrom, dateTo, deferredSearch, pageSize, selectedStatus, sortBy, sortDirection])

  useEffect(() => {
    if (!orders.find((order) => order.id === selectedOrderId) && orders[0]?.id) {
      setSelectedOrderId(orders[0].id)
    }
  }, [orders, selectedOrderId])

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0]
  const selectedOrderIsCredit = selectedOrder?.paymentTypeCode === 'CREDIT'
  const creditOrders = orders.filter((order) => order.paymentTypeCode === 'CREDIT')
  const cashOrders = orders.filter((order) => order.paymentTypeCode !== 'CREDIT')
  const dueSoonCredits = creditOrders.filter((order) => order.dueSoon)
  const overdueCredits = creditOrders.filter((order) => order.collectionStatus === 'Vencido')
  const totalVisibleRevenue = orders.reduce((total, order) => total + order.total, 0)
  const totalCreditBalance = creditOrders.reduce(
    (total, order) => total + (order.balanceDue ?? 0),
    0,
  )
  const totalRegisteredPayments = orders.reduce(
    (total, order) => total + (order.payments?.length ?? 0),
    0,
  )

  const handleStatusChange = (orderId: string, nextStatus: string) => {
    void (async () => {
      try {
        await updateOrderStatus(orderId, nextStatus)
        await refreshCommerce()
        setSuccessMessage('Estado del pedido actualizado correctamente.')
        setPageError('')
      } catch (requestError) {
        setPageError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo actualizar el estado del pedido.',
        )
      }
    })()
  }

  const handlePaymentChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setPaymentForm((current) => ({ ...current, [name]: value }))
  }

  const handleRegisterPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedOrder) {
      return
    }

    void (async () => {
      try {
        await recordOrderPayment(selectedOrder.id, {
          amount: Number(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference.trim() || undefined,
          notes: paymentForm.notes.trim() || undefined,
          proof: proofFile,
        })
        await loadOrders()
        await refreshCommerce()
        setPaymentForm(emptyPaymentForm)
        setProofFile(null)
        setSuccessMessage('Abono registrado correctamente.')
        setPageError('')
      } catch (requestError) {
        setPageError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo registrar el abono.',
        )
      }
    })()
  }

  const handleRunCreditReminders = () => {
    void (async () => {
      try {
        const result = await runCreditReminders()
        setSuccessMessage(
          `Recordatorios ejecutados: ${result.sent} enviados, ${result.failed} fallidos, ventana de ${result.reminderDays} dias.`,
        )
        setPageError('')
        await loadOrders()
      } catch (requestError) {
        setPageError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudieron enviar los recordatorios de credito.',
        )
      }
    })()
  }

  const renderOrderColumn = (
    title: string,
    description: string,
    columnOrders: OrderSummary[],
    tone: 'credit' | 'cash',
  ) => (
    <section className={`orders-column-panel orders-column-panel-${tone}`}>
      <header className="orders-column-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className={`orders-column-counter orders-column-counter-${tone}`}>
          {columnOrders.length}
        </span>
      </header>

      <div className="orders-column-list">
        {columnOrders.length > 0 ? (
          columnOrders.map((order) => (
            <button
              key={order.id}
              type="button"
              className={[
                'orders-entry-card',
                selectedOrder?.id === order.id ? 'orders-entry-card-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setSelectedOrderId(order.id)}
            >
              <div className="orders-entry-main">
                <div className="orders-entry-tags">
                  <span className={`orders-entry-tag orders-entry-tag-${tone}`}>
                    {order.paymentType}
                  </span>
                  {order.dueSoon ? (
                    <span className="orders-entry-tag orders-entry-tag-warning">
                      Por vencer
                    </span>
                  ) : null}
                  {order.collectionStatus === 'Vencido' ? (
                    <span className="orders-entry-tag orders-entry-tag-overdue">
                      Vencido
                    </span>
                  ) : null}
                </div>
                <strong className="orders-entry-name">{order.customer}</strong>
                <p className="orders-entry-order">{getCustomerOrderLabel(order)}</p>
                <small className="muted-line orders-entry-email">{order.email}</small>
                <small className="muted-line">{order.createdAt}</small>
              </div>

              <div className="orders-entry-side">
                <strong>{formatMoney(order.total)}</strong>
                <small>{order.status}</small>
                {order.balanceDue ? <small>Saldo {formatMoney(order.balanceDue)}</small> : null}
                {order.paymentTypeCode === 'CREDIT' ? (
                  <small>{getDueMessage(order)}</small>
                ) : null}
              </div>
            </button>
          ))
        ) : (
          <div className="empty-cart">
            <p>No hay pedidos en este grupo con los filtros actuales.</p>
          </div>
        )}
      </div>
    </section>
  )

  return (
    <main className="admin-page orders-admin-page">
      <PageIntro
        eyebrow="Admin Pedidos"
        title="Seguimiento de pedidos"
        description="Ahora la vista prioriza el cliente, separa claramente credito y contado y deja el seguimiento comercial mucho mas facil."
      />

      <section className="orders-summary-grid">
        <article className="orders-summary-card orders-summary-card-primary">
          <span>Pedidos visibles</span>
          <strong>{orders.length}</strong>
          <p>{formatMoney(totalVisibleRevenue)} moviéndose en esta vista.</p>
        </article>

        <article className="orders-summary-card">
          <span>Saldo a credito</span>
          <strong>{formatMoney(totalCreditBalance)}</strong>
          <p>
            {creditOrders.length} pedidos a credito, {dueSoonCredits.length} por vencer pronto.
          </p>
        </article>

        <article className="orders-summary-card">
          <span>Actividad</span>
          <strong>{totalRegisteredPayments}</strong>
          <p>{overdueCredits.length} creditos vencidos en seguimiento.</p>
          <div className="hero-actions">
            <button
              className="primary-link button-link"
              type="button"
              onClick={handleRunCreditReminders}
            >
              Enviar recordatorios
            </button>
          </div>
        </article>
      </section>

      <section className="orders-layout">
        <section className="table-card orders-board-card">
          <div className="table-header">
            <div>
              <h2>Pedidos por cliente</h2>
              <p>
                {isLoading
                  ? 'Cargando pedidos...'
                  : `${meta?.total ?? orders.length} pedidos visibles en el panel, ordenados para trabajar por cliente.`}
              </p>
            </div>

            <div className="row-actions compact-actions">
              <button
                className="secondary-link button-link"
                type="button"
                onClick={handleRunCreditReminders}
              >
                Recordar creditos
              </button>
              <button
                className="secondary-link button-link"
                type="button"
                onClick={() => void exportOrdersCsv()}
              >
                Exportar CSV
              </button>
            </div>
          </div>

          <div className="filter-bar">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre de cliente, orden, correo o metodo"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="customerName">Cliente</option>
              <option value="createdAt">Mas recientes</option>
              <option value="total">Total</option>
              <option value="status">Estado</option>
            </select>
            <select
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
            <select
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              <option value="8">8 por pagina</option>
              <option value="12">12 por pagina</option>
              <option value="20">20 por pagina</option>
            </select>
            {statusOptions.map((status) => (
              <button
                key={status}
                className={[
                  'filter-chip',
                  selectedStatus === status ? 'filter-chip-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {error || pageError ? (
            <p className="warning-note admin-banner">{pageError || error}</p>
          ) : null}
          {successMessage ? <p className="success-note admin-banner">{successMessage}</p> : null}

          <div className="orders-board-grid">
            {renderOrderColumn(
              'Clientes a credito',
              'Saldos, vencimientos, recordatorios y abonos.',
              creditOrders,
              'credit',
            )}
            {renderOrderColumn(
              'Clientes de contado',
              'Pedidos listos para flujo comercial normal.',
              cashOrders,
              'cash',
            )}
          </div>

          {meta ? (
            <div className="pagination-bar">
              <span>
                Pagina {meta.page} de {meta.totalPages}
              </span>
              <div className="row-actions">
                <button
                  className="secondary-link button-link"
                  type="button"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Anterior
                </button>
                <button
                  className="secondary-link button-link"
                  type="button"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="table-card product-form-card orders-detail-panel">
          {selectedOrder ? (
            <>
              <div className="orders-detail-hero">
                <div>
                  <p className="eyebrow">Cliente seleccionado</p>
                  <h2>{selectedOrder.customer}</h2>
                  <p>{selectedOrder.email}</p>
                </div>

                <div className="orders-detail-pills">
                  <span className="orders-entry-tag orders-entry-tag-neutral">
                    {selectedOrder.paymentType ?? 'N/D'}
                  </span>
                  <span className="orders-entry-tag orders-entry-tag-status">
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="order-detail-stack">
                <div className="orders-detail-grid">
                  <article className="orders-detail-stat">
                    <span>Pedido</span>
                    <strong>{getCustomerOrderLabel(selectedOrder)}</strong>
                    <small>{selectedOrder.createdAt}</small>
                  </article>
                  <article className="orders-detail-stat">
                    <span>Total</span>
                    <strong>{formatMoney(selectedOrder.total)}</strong>
                    <small>{selectedOrder.paymentMethod}</small>
                  </article>
                  <article className="orders-detail-stat">
                    <span>Abonado</span>
                    <strong>{formatMoney(selectedOrder.amountPaid ?? 0)}</strong>
                    <small>{selectedOrder.collectionStatus ?? 'Pendiente'}</small>
                  </article>
                  <article className="orders-detail-stat">
                    <span>Saldo</span>
                    <strong>{formatMoney(selectedOrder.balanceDue ?? 0)}</strong>
                    <small>
                      {selectedOrder.paymentTypeCode === 'CREDIT'
                        ? getDueMessage(selectedOrder)
                        : 'Pedido de contado'}
                    </small>
                  </article>
                </div>

                {selectedOrder.paymentTypeCode === 'CREDIT' ? (
                  <div className="info-note">
                    Ultimo recordatorio enviado:{' '}
                    {selectedOrder.creditReminderSentAt ?? 'No enviado aun'}
                  </div>
                ) : null}

                <section className="orders-detail-section">
                  <p className="panel-label">Productos</p>
                  <ul className="feature-list compact-list orders-compact-list">
                    {selectedOrder.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                {selectedOrderIsCredit ? (
                  <section className="orders-detail-section">
                    <p className="panel-label">Abonos registrados</p>
                    {(selectedOrder.payments ?? []).length > 0 ? (
                      <ul className="feature-list compact-list orders-compact-list">
                        {(selectedOrder.payments ?? []).map((payment) => (
                          <li key={payment.id}>
                            {payment.createdAt} | {formatMoney(payment.amount)} | {payment.paymentMethod}
                            {payment.reference ? ` | Ref: ${payment.reference}` : ''}
                            {payment.proofImage ? (
                              <>
                                {' '}
                                | <a href={payment.proofImage} target="_blank" rel="noreferrer">Comprobante</a>
                              </>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted-line">Todavia no hay abonos registrados para este pedido.</p>
                    )}
                  </section>
                ) : null}

                <section className="orders-detail-section">
                  <label className="status-editor">
                    Estado del pedido
                    <select
                      value={selectedOrder.status}
                      onChange={(event) =>
                        handleStatusChange(selectedOrder.id, event.target.value)
                      }
                    >
                      {statusOptions
                        .filter((status) => status !== 'Todos')
                        .map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                  </label>

                  {selectedOrderIsCredit ? (
                    <form className="product-form" onSubmit={handleRegisterPayment}>
                      <label>
                        Monto del abono
                        <input
                          name="amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={paymentForm.amount}
                          onChange={handlePaymentChange}
                          required
                        />
                      </label>

                      <label>
                        Metodo
                        <select
                          name="paymentMethod"
                          value={paymentForm.paymentMethod}
                          onChange={handlePaymentChange}
                        >
                          <option value="SINPE">SINPE</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Efectivo">Efectivo</option>
                        </select>
                      </label>

                      <label>
                        Referencia
                        <input
                          name="reference"
                          value={paymentForm.reference}
                          onChange={handlePaymentChange}
                        />
                      </label>

                      <label>
                        Observacion
                        <textarea
                          name="notes"
                          value={paymentForm.notes}
                          onChange={handlePaymentChange}
                          rows={3}
                        />
                      </label>

                      <label>
                        Comprobante
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(event) =>
                            setProofFile(event.target.files?.[0] ?? null)
                          }
                        />
                      </label>

                      <button className="primary-link button-link" type="submit">
                        Registrar abono
                      </button>
                    </form>
                  ) : (
                    <p className="muted-line">
                      Este pedido es de contado, asi que no requiere registro de abonos ni comprobantes.
                    </p>
                  )}
                </section>

                {pageError ? <p className="warning-note">{pageError}</p> : null}
                {!pageError && successMessage ? (
                  <p className="success-note">{successMessage}</p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="empty-cart">
              <h2>No hay pedidos en este filtro</h2>
              <p>Cambia el filtro para ver otros pedidos del panel.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}

export default AdminOrdersPage
