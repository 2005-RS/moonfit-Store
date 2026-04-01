import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { readAndClearAuthNotice } from '../../lib/auth'

function ProtectedAdminRoute() {
  const location = useLocation()
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated || !isAdmin) {
    const notice =
      readAndClearAuthNotice() ||
      (!isAuthenticated || !isAdmin
        ? 'Necesitas iniciar sesion con una cuenta ADMIN para acceder al panel.'
        : '')

    return <Navigate to="/admin/login" replace state={{ from: location, notice }} />
  }

  return <Outlet />
}

export default ProtectedAdminRoute
