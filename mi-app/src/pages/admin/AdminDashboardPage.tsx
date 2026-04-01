import { useEffect, useState } from 'react'
import PageIntro from '../../components/shared/PageIntro'
import { fetchDashboardOverview } from '../../lib/adminApi'
import { useAuth } from '../../context/AuthContext'
import { useCommerce } from '../../context/CommerceContext'
import { formatCurrency } from '../../lib/currency'
import type {
  DashboardExpirationAlert,
  DashboardOrderStatusPoint,
  DashboardOverview,
} from '../../types/catalog'

const dashboardStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PROCESSING: 'Procesando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${value}T12:00:00`))
}

function formatExpirationDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function getMaxValue(values: number[]) {
  return Math.max(...values, 1)
}

function buildSparkline(values: number[]) {
  const safeValues = values.length > 0 ? values : [0]
  const max = getMaxValue(safeValues)

  return safeValues
    .map((value, index) => {
      const x = safeValues.length === 1 ? 50 : (index / (safeValues.length - 1)) * 100
      const y = 100 - (value / max) * 88
      return `${x},${y}`
    })
    .join(' ')
}

function formatStatusLabel(status: string) {
  return dashboardStatusLabels[status] ?? status
}

function formatCompactCurrency(value: number) {
  return formatCurrency(value)
}

function getExpirationMessage(alert: DashboardExpirationAlert) {
  if (alert.daysUntilExpiration < 0) {
    const days = Math.abs(alert.daysUntilExpiration)
    return `Vencio hace ${days} ${days === 1 ? 'dia' : 'dias'}`
  }

  if (alert.daysUntilExpiration === 0) {
    return 'Vence hoy'
  }

  if (alert.daysUntilExpiration === 1) {
    return 'Vence manana'
  }

  return `Vence en ${alert.daysUntilExpiration} dias`
}

function getStatusTone(status: DashboardOrderStatusPoint['status']) {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return 'safe'
    case 'PROCESSING':
    case 'SHIPPED':
      return 'info'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'warning'
  }
}

function AdminDashboardPage() {
  const { isProfileLoading, profile, profileError, session } = useAuth()
  const { products, orders, inventoryMovements } = useCommerce()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [overviewError, setOverviewError] = useState('')
  const lowStockCount = products.filter((product) => product.stock <= 10).length
  const todaySales = orders.reduce((sum, order) => sum + order.total, 0)
  const revenueTrendValues = overview?.trends.map((trend) => trend.revenue) ?? []
  const orderTrendValues = overview?.trends.map((trend) => trend.orders) ?? []
  const orderTrendMax = getMaxValue(orderTrendValues)
  const trendRevenueTotal = revenueTrendValues.reduce((sum, value) => sum + value, 0)
  const trendAverageRevenue =
    revenueTrendValues.length > 0 ? trendRevenueTotal / revenueTrendValues.length : 0
  const bestTrend =
    overview && overview.trends.length > 0
      ? overview.trends.reduce((best, current) =>
          current.revenue > best.revenue ? current : best,
        )
      : null
  const inventoryHealthMax = getMaxValue(
    overview?.inventoryHealth.map((item) => item.count) ?? [0],
  )
  const orderStatusMax = getMaxValue(
    overview?.orderStatusBreakdown.map((item) => item.count) ?? [0],
  )
  const topProductRevenueMax = getMaxValue(
    overview?.topProducts.map((item) => item.revenue) ?? [0],
  )

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await fetchDashboardOverview()
        setOverview(response)
        setOverviewError('')
      } catch (requestError) {
        setOverviewError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo cargar el dashboard.',
        )
      }
    }

    void loadOverview()
  }, [])

  return (
    <main className="admin-page">
      <PageIntro
        eyebrow="Administrador"
        title="Dashboard operativo con foco en ventas, inventario y vencimientos"
        description="Ahora el panel te muestra el pulso del negocio, alertas de vencimiento y visuales para decidir rapido."
      />

      <section className="admin-dashboard-hero">
        <article className="admin-dashboard-hero-card admin-dashboard-hero-card-primary">
          <p className="eyebrow">Resumen comercial</p>
          <h2>{formatCurrency(overview?.metrics.revenueTotal ?? todaySales)}</h2>
          <p>
            {overview
              ? `${overview.metrics.totalOrders} pedidos acumulados y ticket promedio de ${formatCurrency(
                  overview.metrics.averageOrderValue,
                )}.`
              : 'Cargando consolidado comercial del backend.'}
          </p>
          <div className="admin-dashboard-hero-stats">
            <span>
              <strong>{formatCurrency(overview?.metrics.revenueLast7Days ?? 0)}</strong>
              Ingreso ultimos 7 dias
            </span>
            <span>
              <strong>{String(overview?.metrics.ordersLast7Days ?? 0)}</strong>
              Pedidos ultimos 7 dias
            </span>
          </div>
        </article>

        <article className="admin-dashboard-hero-card">
          <p className="eyebrow">Control de inventario</p>
          <h2>{String(overview?.metrics.totalUnits ?? 0)}</h2>
          <p>Unidades activas monitoreadas desde inventario y catalogo.</p>
          <div className="admin-dashboard-badges">
            <span className="dashboard-pill warning">
              {overview?.metrics.lowStockProducts ?? lowStockCount} con stock bajo
            </span>
            <span className="dashboard-pill danger">
              {overview?.metrics.expiredProducts ?? 0} vencidos
            </span>
            <span className="dashboard-pill info">
              {overview?.metrics.expiringSoonProducts ?? 0} por vencer
            </span>
          </div>
        </article>

        <article className="admin-dashboard-hero-card">
          <p className="eyebrow">Sesion activa</p>
          <h2>{profile?.email ?? session?.user.email ?? 'Sin sesion activa'}</h2>
          <p>
            {isProfileLoading
              ? 'Validando permisos del panel...'
              : profileError || `Rol activo: ${profile?.role ?? session?.user.role ?? 'N/D'}`}
          </p>
          <div className="admin-dashboard-badges">
            <span className="dashboard-pill neutral">{orders.length} pedidos cargados</span>
            <span className="dashboard-pill neutral">
              {inventoryMovements.length} movimientos recientes
            </span>
          </div>
        </article>
      </section>

      <section className="admin-dashboard-metric-grid">
        {[
          {
            label: 'Ventas totales',
            value: formatCurrency(overview?.metrics.revenueTotal ?? todaySales),
            detail: `${overview?.metrics.totalOrders ?? orders.length} pedidos historicos`,
          },
          {
            label: 'Ticket promedio',
            value: formatCurrency(overview?.metrics.averageOrderValue ?? 0),
            detail: 'Valor medio por pedido registrado',
          },
          {
            label: 'Productos con stock bajo',
            value: String(overview?.metrics.lowStockProducts ?? lowStockCount),
            detail: 'Stock critico detectado por inventario',
          },
          {
            label: 'Por vencer en 15 dias',
            value: String(overview?.metrics.expiringSoonProducts ?? 0),
            detail: 'Productos con alerta preventiva activa',
          },
          {
            label: 'Vencidos',
            value: String(overview?.metrics.expiredProducts ?? 0),
            detail: 'Requieren revision inmediata',
          },
          {
            label: 'Clientes activos',
            value: String(overview?.metrics.totalCustomers ?? 0),
            detail: `${overview?.metrics.totalProducts ?? products.length} productos cargados`,
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className="metric-card dashboard-card admin-dashboard-metric-card"
          >
            <p className="panel-label">{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </section>

      {overviewError ? <p className="warning-note admin-banner">{overviewError}</p> : null}

      {overview ? (
        <>
          <section className="admin-dashboard-alert-board">
            <article className="table-card admin-dashboard-alert-card">
              <div className="section-heading">
                <p className="eyebrow">Alerta general</p>
                <h2>
                  {overview.expiringProducts.length > 0
                    ? 'Productos que requieren atencion por vencimiento'
                    : 'No hay productos en riesgo de vencimiento inmediato'}
                </h2>
                <p>
                  {overview.expiringProducts.length > 0
                    ? 'La lista combina vencidos y productos que vencen dentro de los proximos 15 dias.'
                    : 'El inventario con fecha registrada luce controlado en este momento.'}
                </p>
              </div>
              <div className="admin-dashboard-expiration-list">
                {overview.expiringProducts.length > 0 ? (
                  overview.expiringProducts.map((item) => (
                    <article
                      key={item.id}
                      className={`admin-dashboard-expiration-item ${item.severity}`}
                    >
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.brand ?? 'Sin marca'} | {item.category ?? 'Sin categoria'}
                        </p>
                      </div>
                      <div className="admin-dashboard-expiration-meta">
                        <span
                          className={`dashboard-pill ${
                            item.severity === 'expired' ? 'danger' : 'warning'
                          }`}
                        >
                          {getExpirationMessage(item)}
                        </span>
                        <small>
                          {formatExpirationDate(item.expirationDate)} | Stock {item.stock}
                        </small>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="success-note">
                    No hay alertas de vencimiento activas para los proximos 15 dias.
                  </p>
                )}
              </div>
            </article>
          </section>

          <section className="admin-dashboard-chart-grid">
            <article className="table-card admin-dashboard-chart-card admin-dashboard-chart-card-primary">
              <div className="section-heading">
                <p className="eyebrow">Tendencia</p>
                <h2>Ingresos y pedidos de los ultimos 7 dias</h2>
                <p>Lectura rapida para saber si el ritmo comercial sube o se enfria.</p>
              </div>

              <div className="admin-dashboard-chart-stat-row">
                <article className="admin-dashboard-chart-stat">
                  <span>Ingreso acumulado</span>
                  <strong>{formatCompactCurrency(trendRevenueTotal)}</strong>
                  <small>Lectura semanal</small>
                </article>
                <article className="admin-dashboard-chart-stat">
                  <span>Promedio diario</span>
                  <strong>{formatCompactCurrency(trendAverageRevenue)}</strong>
                  <small>Ritmo por jornada</small>
                </article>
                <article className="admin-dashboard-chart-stat">
                  <span>Pico de ingreso</span>
                  <strong>
                    {bestTrend ? formatCompactCurrency(bestTrend.revenue) : formatCurrency(0)}
                  </strong>
                  <small>{bestTrend ? formatShortDate(bestTrend.date) : 'Sin datos'}</small>
                </article>
              </div>

              <div className="admin-dashboard-line-shell">
                <div className="admin-dashboard-line-shell-grid" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="admin-dashboard-line-chart"
                >
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    points={buildSparkline(revenueTrendValues)}
                  />
                </svg>
                <div className="admin-dashboard-line-columns">
                  {overview.trends.map((trend, index) => (
                    <div key={trend.date} className="admin-dashboard-line-column">
                      <small className="admin-dashboard-line-date">
                        {formatShortDate(trend.date)}
                      </small>
                      <div className="admin-dashboard-line-bar-shell">
                        <div
                          className="admin-dashboard-line-bar"
                          style={{
                            height: `${Math.max(
                              14,
                              (orderTrendValues[index] / orderTrendMax) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="admin-dashboard-line-value">
                        <strong>{formatCompactCurrency(trend.revenue)}</strong>
                        <span>{trend.orders} pedidos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="table-card admin-dashboard-chart-card">
              <div className="section-heading">
                <p className="eyebrow">Top ventas</p>
                <h2>Productos con mejor rendimiento</h2>
                <p>Ayuda a decidir reposicion, promocion y bundles.</p>
              </div>

              <div className="admin-dashboard-top-products">
                {overview.topProducts.map((product, index) => (
                  <article key={product.productId} className="admin-dashboard-top-product">
                    <div className="admin-dashboard-top-product-rank">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="admin-dashboard-top-product-body">
                      <div className="admin-dashboard-top-product-copy">
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.quantity} unidades vendidas</span>
                        </div>
                        <strong className="admin-dashboard-top-product-amount">
                          {formatCompactCurrency(product.revenue)}
                        </strong>
                      </div>
                      <div className="admin-dashboard-progress-track">
                        <span
                          className="admin-dashboard-progress-fill"
                          style={{
                            width: `${(product.revenue / topProductRevenueMax) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-dashboard-chart-grid admin-dashboard-chart-grid-secondary">
            <article className="table-card admin-dashboard-chart-card">
              <div className="section-heading">
                <p className="eyebrow">Salud del inventario</p>
                <h2>Balance entre stock, riesgo y vencimiento</h2>
                <p>Lectura compacta del estado general del catalogo activo.</p>
              </div>

              <div className="admin-dashboard-breakdown-list">
                {overview.inventoryHealth.map((item) => (
                  <article key={item.label} className="admin-dashboard-breakdown-row">
                    <div className="admin-dashboard-breakdown-head">
                      <div>
                        <strong>{item.label}</strong>
                        <span>Estado del catalogo</span>
                      </div>
                      <div className="admin-dashboard-breakdown-metric">
                        <strong>{item.count}</strong>
                        <small>
                          {Math.round((item.count / inventoryHealthMax) * 100)}% del maximo
                        </small>
                      </div>
                    </div>
                    <div className="admin-dashboard-progress-track">
                      <span
                        className="admin-dashboard-progress-fill inventory"
                        style={{
                          width: `${(item.count / inventoryHealthMax) * 100}%`,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="table-card admin-dashboard-chart-card">
              <div className="section-heading">
                <p className="eyebrow">Estados de pedido</p>
                <h2>Distribucion operativa actual</h2>
                <p>Te muestra donde esta atorada o fluyendo la operacion.</p>
              </div>

              <div className="admin-dashboard-breakdown-list">
                {overview.orderStatusBreakdown.map((item) => (
                  <article key={item.status} className="admin-dashboard-breakdown-row">
                    <div className="admin-dashboard-breakdown-head">
                      <div>
                        <strong>{formatStatusLabel(item.status)}</strong>
                        <span>Flujo operativo actual</span>
                      </div>
                      <div className="admin-dashboard-breakdown-metric">
                        <strong>{item.count}</strong>
                        <small>
                          {Math.round((item.count / orderStatusMax) * 100)}% del pico
                        </small>
                      </div>
                    </div>
                    <div className="admin-dashboard-progress-track">
                      <span
                        className={`admin-dashboard-progress-fill ${getStatusTone(item.status)}`}
                        style={{
                          width: `${(item.count / orderStatusMax) * 100}%`,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-dashboard-bottom-grid">
            <aside className="summary-card">
              <h2>Pedidos recientes</h2>
              <div className="order-list">
                {orders.slice(0, 5).map((order) => (
                  <div className="order-row" key={order.id}>
                    <div>
                      <strong>{order.orderNumber ?? order.id}</strong>
                      <p>{order.customer}</p>
                    </div>
                    <div className="order-meta">
                      <span>{formatCurrency(order.total)}</span>
                      <small>{order.status}</small>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <article className="content-section admin-dashboard-activity-card">
              <div className="section-heading">
                <p className="eyebrow">Auditoria</p>
                <h2>Actividad reciente</h2>
                <p>Cambios recientes sobre productos, pedidos e inventario.</p>
              </div>
              <div className="table-list">
                {overview.recentActivity.map((entry) => (
                  <div className="table-row" key={entry.id}>
                    <div>
                      <strong>{entry.summary}</strong>
                      <p>{entry.entityType}</p>
                    </div>
                    <div className="table-meta">
                      <span>{entry.actorEmail ?? 'Sistema'}</span>
                      <small>{entry.createdAt}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </main>
  )
}

export default AdminDashboardPage
