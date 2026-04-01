import { FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { clearAuthSession } from '../../lib/auth'

function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const routeState = (location.state as {
    from?: { pathname?: string }
    notice?: string
  } | null)
  const redirectTo = routeState?.from?.pathname ?? '/admin'

  useEffect(() => {
    if (isAdmin) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAdmin, navigate, redirectTo])

  useEffect(() => {
    if (routeState?.notice) {
      setNotice(routeState.notice)
      navigate(location.pathname, { replace: true, state: { from: routeState.from } })
    }
  }, [location.pathname, navigate, routeState])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const session = await login(email, password)

      if (session.user.role !== 'ADMIN') {
        clearAuthSession('admin_required')
        setError('Esta cuenta no tiene permisos de administrador.')
        return
      }

      setNotice('')
      navigate(redirectTo, { replace: true })
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'No se pudo iniciar sesion.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <p className="eyebrow">Admin Access</p>
        <h1 className="admin-login-title">Entrar al panel operativo</h1>
        <p className="admin-login-copy">
          Usa una cuenta con rol administrador para gestionar catalogo, pedidos,
          inventario y clientes.
        </p>
        <p className="muted-login-hint">
          Si el acceso falla, verifica que el seed haya corrido y que tu usuario
          admin exista con la clave configurada para este entorno.
        </p>

        {notice ? <p className="info-note">{notice}</p> : null}

        <form className="product-form admin-login-form" onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="warning-note">{error}</p> : null}

          <div className="form-actions">
            <button className="primary-link button-link" type="submit" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar al admin'}
            </button>
            <Link to="/" className="secondary-link">
              Volver a la tienda
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}

export default AdminLoginPage
