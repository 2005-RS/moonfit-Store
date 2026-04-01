import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../../components/catalog/ProductCard'
import PageIntro from '../../components/shared/PageIntro'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { saveAuthSession } from '../../lib/auth'
import { formatCurrency } from '../../lib/currency'
import {
  fetchCustomerProfile,
  fetchMyOrders,
  registerCustomerAccount,
  reportCustomerPayment,
  reorderOrder,
  updateCustomerProfile,
  type AuthSession,
} from '../../lib/customerApi'
import type { CustomerOrder, CustomerProfile } from '../../types/catalog'

type AuthFormState = {
  name: string
  email: string
  password: string
  phone: string
  city: string
}

const emptyAuthForm: AuthFormState = {
  name: '',
  email: '',
  password: '',
  phone: '',
  city: '',
}

type PaymentReportFormState = {
  amount: string
  paymentMethod: string
  reference: string
  notes: string
}

const emptyPaymentReportForm: PaymentReportFormState = {
  amount: '',
  paymentMethod: 'SINPE',
  reference: '',
  notes: '',
}

function CustomerAccountPage() {
  const { isAuthenticated, isAdmin, login, logout, profile, refreshProfile } = useAuth()
  const { addBundleToCart, addToCart } = useCart()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState<AuthFormState>(emptyAuthForm)
  const [account, setAccount] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentOrderId, setPaymentOrderId] = useState('')
  const [paymentReportForm, setPaymentReportForm] = useState<PaymentReportFormState>(
    emptyPaymentReportForm,
  )
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)

  const loadAccount = async () => {
    setIsLoading(true)

    try {
      const [nextProfile, nextOrders] = await Promise.all([
        fetchCustomerProfile(),
        fetchMyOrders(),
      ])
      setAccount(nextProfile)
      setOrders(nextOrders)
      setPageError('')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo cargar tu cuenta.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      void loadAccount()
    }
  }, [isAuthenticated, isAdmin])

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setPageError('')
    setSuccessMessage('')

    try {
      let session: AuthSession

      if (mode === 'login') {
        session = await login(authForm.email, authForm.password)
      } else {
        session = await registerCustomerAccount(authForm)
        saveAuthSession(session)
      }

      if (session.user.role !== 'CUSTOMER') {
        setPageError('Esta vista esta pensada para cuentas de cliente.')
        return
      }

      await refreshProfile()
      await loadAccount()
      setSuccessMessage(
        mode === 'login'
          ? 'Sesion iniciada correctamente.'
          : 'Tu cuenta esta lista para empezar a comprar.',
      )
      setAuthForm(emptyAuthForm)
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo completar la autenticacion.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!account) {
      return
    }

    setIsSubmitting(true)
    setPageError('')
    setSuccessMessage('')

    try {
      const nextProfile = await updateCustomerProfile({
        name: account.name,
        email: account.email,
        phone: account.phone ?? '',
        city: account.city ?? '',
      })
      setAccount(nextProfile)
      await refreshProfile()
      setSuccessMessage('Perfil actualizado correctamente.')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo actualizar el perfil.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReorder = async (orderId: string) => {
    setPageError('')
    setSuccessMessage('')

    try {
      await reorderOrder(orderId)
      await loadAccount()
      setSuccessMessage('Tu pedido anterior fue recuperado y ya puedes continuar con la compra.')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo recuperar ese pedido.',
      )
    }
  }

  const handleReportPayment = async (orderId: string) => {
    setPageError('')
    setSuccessMessage('')

    try {
      await reportCustomerPayment(orderId, {
        amount: Number(paymentReportForm.amount),
        paymentMethod: paymentReportForm.paymentMethod,
        reference: paymentReportForm.reference.trim() || undefined,
        notes: paymentReportForm.notes.trim() || undefined,
        proof: paymentProofFile,
      })
      await loadAccount()
      setPaymentOrderId('')
      setPaymentReportForm(emptyPaymentReportForm)
      setPaymentProofFile(null)
      setSuccessMessage('Tu abono fue reportado correctamente junto con el comprobante.')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo reportar el abono.',
      )
    }
  }

  if (isAdmin) {
    return (
      <main className="page-shell">
        <PageIntro
          eyebrow="Cuenta"
          title="Tu sesion actual es administrativa"
          description="Esta vista esta reservada para cuentas de cliente. Puedes volver a la tienda o entrar al panel."
        />
      </main>
    )
  }

  if (!isAuthenticated || profile?.role !== 'CUSTOMER') {
    return (
      <main className="page-shell">
        <PageIntro
          eyebrow="Cuenta"
          title="Tu cuenta Moonfit"
          description="Inicia sesion o crea tu cuenta para guardar favoritos, revisar pedidos y volver a comprar con mas facilidad."
        />

        <section className="admin-products-layout">
          <section className="table-card">
            <div className="table-header">
              <div>
                <h2>{mode === 'login' ? 'Entrar a mi cuenta' : 'Crear cuenta'}</h2>
                <p>
                  {mode === 'login'
                    ? 'Accede a favoritos, historial y recomendaciones guardadas.'
                    : 'Registra tus datos para comprar, guardar pedidos y volver cuando quieras.'}
                </p>
              </div>
              <button
                className="secondary-link button-link"
                type="button"
                onClick={() => setMode((current) => (current === 'login' ? 'register' : 'login'))}
              >
                {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
              </button>
            </div>

            <form className="product-form" onSubmit={handleAuthSubmit}>
              {mode === 'register' ? (
                <label>
                  Nombre
                  <input
                    value={authForm.name}
                    onChange={(event) =>
                      setAuthForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </label>
              ) : null}

              <label>
                Correo
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Contrasena
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, password: event.target.value }))
                  }
                  required
                />
              </label>

              {mode === 'register' ? (
                <>
                  <label>
                    Telefono
                    <input
                      value={authForm.phone}
                      onChange={(event) =>
                        setAuthForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>

                  <label>
                    Ciudad
                    <input
                      value={authForm.city}
                      onChange={(event) =>
                        setAuthForm((current) => ({ ...current, city: event.target.value }))
                      }
                    />
                  </label>
                </>
              ) : null}

              {pageError ? <p className="warning-note">{pageError}</p> : null}
              {successMessage ? <p className="success-note">{successMessage}</p> : null}

              <div className="form-actions">
                <button className="primary-link button-link" type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Procesando...'
                    : mode === 'login'
                      ? 'Entrar'
                      : 'Crear mi cuenta'}
                </button>
                <Link to="/catalogo" className="secondary-link">
                  Ver catalogo
                </Link>
              </div>
            </form>
          </section>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <PageIntro
        eyebrow="Mi cuenta"
        title="Tu perfil, favoritos e historial en un solo lugar"
        description="Administra tus datos, revisa pedidos anteriores y vuelve a tus piezas favoritas sin empezar desde cero."
      />

      <section className="admin-products-layout">
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Datos de la cuenta</h2>
              <p>{isLoading ? 'Cargando perfil...' : 'Actualiza tu informacion de contacto con calma.'}</p>
            </div>
          </div>

          {account ? (
            <form className="product-form" onSubmit={handleProfileSubmit}>
              <label>
                Nombre
                <input
                  value={account.name}
                  onChange={(event) =>
                    setAccount((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    )
                  }
                  required
                />
              </label>

              <label>
                Correo
                <input
                  type="email"
                  value={account.email}
                  onChange={(event) =>
                    setAccount((current) =>
                      current ? { ...current, email: event.target.value } : current,
                    )
                  }
                  required
                />
              </label>

              <div className="form-row">
                <label>
                  Telefono
                  <input
                    value={account.phone ?? ''}
                    onChange={(event) =>
                      setAccount((current) =>
                        current ? { ...current, phone: event.target.value } : current,
                      )
                    }
                  />
                </label>

                <label>
                  Ciudad
                  <input
                    value={account.city ?? ''}
                    onChange={(event) =>
                      setAccount((current) =>
                        current ? { ...current, city: event.target.value } : current,
                      )
                    }
                  />
                </label>
              </div>

              {pageError ? <p className="warning-note">{pageError}</p> : null}
              {successMessage ? <p className="success-note">{successMessage}</p> : null}

              <div className="form-actions">
                <button className="primary-link button-link" type="submit" disabled={isSubmitting}>
                  Guardar perfil
                </button>
                <button
                  className="secondary-link button-link"
                  type="button"
                  onClick={() => {
                    logout()
                    setAccount(null)
                    setOrders([])
                    setPageError('')
                    setSuccessMessage('')
                  }}
                >
                  Cerrar sesion
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <aside className="table-card product-form-card">
          <div className="table-header">
            <div>
              <h2>Resumen</h2>
              <p>Un punto unico para favoritos, historial y seguimiento de cuenta.</p>
            </div>
          </div>

          <div className="summary-row">
            <span>Favoritos guardados</span>
            <strong>{account?.favorites.length ?? 0}</strong>
          </div>
          <div className="summary-row">
            <span>Pedidos registrados</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="summary-row">
            <span>Credito</span>
            <strong>{account?.creditApproved ? 'Aprobado' : 'No aprobado'}</strong>
          </div>
          <div className="summary-row">
            <span>Limite</span>
            <strong>{formatCurrency(account?.creditLimit ?? 0)}</strong>
          </div>
          <div className="summary-row">
            <span>Plazo</span>
            <strong>{account?.creditDays ?? 0} dias</strong>
          </div>
          <div className="summary-row">
            <span>Correo activo</span>
            <strong>{profile?.email ?? account?.email ?? 'Sin correo'}</strong>
          </div>
        </aside>
      </section>

      <section className="store-section" id="favoritos">
        <div className="section-heading">
          <p className="eyebrow">Favoritos</p>
          <h2>Piezas guardadas para volver cuando quieras</h2>
          <p>Conserva tus favoritos para retomarlos con facilidad y llevarlos de nuevo a tu seleccion.</p>
        </div>

        {account && account.favorites.length > 0 ? (
          <div className="hero-actions">
            <button
              className="primary-link button-link"
              type="button"
              onClick={() =>
                addBundleToCart(
                  account.favorites.map((product) => ({
                    product,
                    quantity: 1,
                  })),
                )
              }
            >
              Agregar todos al carrito
            </button>
          </div>
        ) : null}

        <div className="product-grid">
          {account?.favorites.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
              <div className="hero-actions">
                <button
                  className="secondary-link button-link"
                  type="button"
                  onClick={() => addToCart(product)}
                >
                  Agregar al carrito
                </button>
              </div>
            </div>
          ))}
        </div>

        {account && account.favorites.length === 0 ? (
          <section className="empty-cart">
            <p>Aun no has guardado favoritos dentro de la tienda.</p>
          </section>
        ) : null}
      </section>

      <section className="store-section" id="historial-pedidos">
        <div className="section-heading">
          <p className="eyebrow">Historial de pedidos</p>
          <h2>Retoma tus pedidos sin empezar desde cero</h2>
          <p>Cada pedido queda disponible para consultarlo, repetirlo o seguir su estado con claridad.</p>
        </div>

        <div className="table-list">
          {orders.map((order) => (
            <article key={order.id} className="table-row">
              {(() => {
                const isCreditOrder = order.paymentType === 'CREDIT'

                return (
                  <>
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <p>
                        {new Intl.DateTimeFormat('es-CR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(order.createdAt))}
                      </p>
                      <small className="muted-line">
                        {order.items.map((item) => `${item.product.name} x${item.quantity}`).join(', ')}
                      </small>
                    </div>

                    <div className="table-meta">
                      <span>{formatCurrency(order.total)}</span>
                      <small>{order.status}</small>
                      <small>Saldo: {formatCurrency(order.balanceDue)}</small>
                      <div className="row-actions">
                        <button
                          className="primary-link button-link"
                          type="button"
                          onClick={() => void handleReorder(order.id)}
                        >
                          Volver a pedir
                        </button>
                        {isCreditOrder && order.balanceDue > 0 ? (
                          <button
                            className="secondary-link button-link"
                            type="button"
                            onClick={() =>
                              setPaymentOrderId((current) =>
                                current === order.id ? '' : order.id,
                              )
                            }
                          >
                            Reportar pago
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {isCreditOrder && order.payments.length > 0 ? (
                      <div>
                        <small className="muted-line">
                          {order.payments.map((payment) => (
                            <span key={payment.id}>
                              {formatCurrency(payment.amount)} {payment.paymentMethod}
                              {payment.proofImage ? (
                                <>
                                  {' '}
                                  <a href={payment.proofImage} target="_blank" rel="noreferrer">
                                    comprobante
                                  </a>{' '}
                                </>
                              ) : (
                                ' '
                              )}
                            </span>
                          ))}
                        </small>
                      </div>
                    ) : null}

                    {isCreditOrder && paymentOrderId === order.id ? (
                      <form
                        className="product-form"
                        onSubmit={(event) => {
                          event.preventDefault()
                          void handleReportPayment(order.id)
                        }}
                      >
                        <label>
                          Monto del abono
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={paymentReportForm.amount}
                            onChange={(event) =>
                              setPaymentReportForm((current) => ({
                                ...current,
                                amount: event.target.value,
                              }))
                            }
                            required
                          />
                        </label>

                        <label>
                          Metodo
                          <select
                            value={paymentReportForm.paymentMethod}
                            onChange={(event) =>
                              setPaymentReportForm((current) => ({
                                ...current,
                                paymentMethod: event.target.value,
                              }))
                            }
                          >
                            <option value="SINPE">SINPE</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta</option>
                          </select>
                        </label>

                        <label>
                          Referencia
                          <input
                            value={paymentReportForm.reference}
                            onChange={(event) =>
                              setPaymentReportForm((current) => ({
                                ...current,
                                reference: event.target.value,
                              }))
                            }
                          />
                        </label>

                        <label>
                          Observacion
                          <textarea
                            rows={3}
                            value={paymentReportForm.notes}
                            onChange={(event) =>
                              setPaymentReportForm((current) => ({
                                ...current,
                                notes: event.target.value,
                              }))
                            }
                          />
                        </label>

                        <label>
                          Comprobante
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(event) =>
                              setPaymentProofFile(event.target.files?.[0] ?? null)
                            }
                          />
                        </label>

                        <button className="primary-link button-link" type="submit">
                          Enviar pago
                        </button>
                      </form>
                    ) : null}
                  </>
                )
              })()}
            </article>
          ))}
        </div>

        {orders.length === 0 ? (
          <section className="empty-cart">
            <p>Aun no hay pedidos asociados a esta cuenta.</p>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default CustomerAccountPage
