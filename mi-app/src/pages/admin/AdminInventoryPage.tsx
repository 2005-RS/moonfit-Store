import { useEffect, useState, type FormEvent } from 'react'
import PageIntro from '../../components/shared/PageIntro'
import { useCommerce } from '../../context/CommerceContext'

function AdminInventoryPage() {
  const { products, inventoryMovements, adjustStock, isLoading, error } = useCommerce()
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('Ingreso manual')
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!selectedProductId && products[0]?.id) {
      setSelectedProductId(products[0].id)
    }
  }, [products, selectedProductId])

  const lowStockProducts = products.filter((product) => product.stock <= 5)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedProductId || !quantity) {
      setPageError('Selecciona un producto e indica una cantidad valida.')
      return
    }

    void (async () => {
      try {
        await adjustStock(selectedProductId, Number(quantity), reason)
        setSuccessMessage('Movimiento de inventario registrado correctamente.')
        setPageError('')
        setQuantity('1')
        setReason('Ingreso manual')
      } catch (requestError) {
        setPageError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo registrar el movimiento de inventario.',
        )
      }
    })()
  }

  return (
    <main className="admin-page">
      <PageIntro
        eyebrow="Admin Inventarios"
        title="Control de stock y movimientos"
        description="Esta seccion ya refleja stock actual, alertas de bajo inventario y movimientos generados por pedidos o ajustes manuales."
      />

      <section className="admin-metric-grid">
        <article className="metric-card dashboard-card">
          <p className="panel-label">Productos con stock bajo</p>
          <strong>{lowStockProducts.length}</strong>
          <span>Productos en 5 unidades o menos.</span>
        </article>
        <article className="metric-card dashboard-card">
          <p className="panel-label">Movimientos registrados</p>
          <strong>{isLoading ? '...' : inventoryMovements.length}</strong>
          <span>Entradas, salidas y ajustes recientes.</span>
        </article>
        <article className="metric-card dashboard-card">
          <p className="panel-label">Stock total</p>
          <strong>{products.reduce((sum, product) => sum + product.stock, 0)}</strong>
          <span>Unidades activas dentro del catalogo.</span>
        </article>
      </section>

      <section className="orders-layout">
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Inventario actual</h2>
              <p>Control rapido del stock disponible por producto.</p>
            </div>
          </div>

          {error || pageError ? (
            <p className="warning-note admin-banner">{pageError || error}</p>
          ) : null}
          {successMessage ? <p className="success-note admin-banner">{successMessage}</p> : null}

          <div className="table-list">
            {products.map((product) => (
              <div className="table-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <p>
                    {product.brand} - {product.category}
                  </p>
                </div>
                <div className="table-meta">
                  <span>{product.stock} uds</span>
                  <small>{product.stock <= 5 ? 'Stock bajo' : 'Stock estable'}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="table-card product-form-card">
          <div className="table-header">
            <div>
              <h2>Ajuste manual</h2>
              <p>Usa entradas positivas o negativas para corregir inventario.</p>
            </div>
          </div>

          <form className="product-form" onSubmit={handleSubmit}>
            <label className="status-editor">
              Producto
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Cantidad
              <input
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>

            <label>
              Motivo
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
              />
            </label>

            {pageError ? <p className="warning-note">{pageError}</p> : null}
            {!pageError && successMessage ? <p className="success-note">{successMessage}</p> : null}

            <div className="form-actions">
              <button className="primary-link button-link" type="submit">
                Registrar movimiento
              </button>
            </div>
          </form>

          <div className="table-header inventory-header">
            <div>
              <h2>Movimientos recientes</h2>
            </div>
          </div>

          <div className="table-list inventory-movements">
            {inventoryMovements.length === 0 ? (
              <p className="muted-line">Aun no hay movimientos registrados.</p>
            ) : (
              inventoryMovements.slice(0, 6).map((movement) => (
                <div className="table-row" key={movement.id}>
                  <div>
                    <strong>{movement.productName}</strong>
                    <p>{movement.reason}</p>
                    <small className="muted-line">{movement.createdAt}</small>
                  </div>
                  <div className="table-meta">
                    <span>{movement.type}</span>
                    <small>{movement.quantity} uds</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  )
}

export default AdminInventoryPage
