import { Link, Outlet } from 'react-router-dom'
import AdminSidebar from '../components/layout/AdminSidebar'
import { useAuth } from '../context/AuthContext'

function AdminLayout() {
  const { isProfileLoading, logout, profile, profileError, session } = useAuth()

  const sessionStatus = isProfileLoading
    ? 'Validando sesion'
    : profile
      ? `Sesion activa: ${profile.role}`
      : 'Sesion pendiente'

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Administracion</p>
            <h2 className="admin-topbar-title">Vista operativa de Moonfit</h2>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-status-pill">
              <span className="status-dot admin-status-dot" />
              {sessionStatus}
            </div>
            {session ? (
              <div className="admin-user-pill">
                <strong>{profile?.email ?? session.user.email}</strong>
                <button
                  type="button"
                  className="secondary-link button-link"
                  onClick={() => {
                    logout()
                    window.location.href = '/admin/login'
                  }}
                >
                  Cerrar sesion
                </button>
              </div>
            ) : null}
            <Link to="/" className="secondary-link">
              Volver a la tienda
            </Link>
          </div>
        </div>
        {profileError ? (
          <p className="warning-note admin-banner">
            {profileError}
          </p>
        ) : null}
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
