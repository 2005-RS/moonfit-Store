import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MoonfitBrand from '../branding/MoonfitBrand'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/marcas', label: 'Marcas' },
  { to: '/admin/combos', label: 'Combos' },
  { to: '/admin/promociones', label: 'Banners y ofertas' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/inventarios', label: 'Inventarios' },
  { to: '/admin/clientes', label: 'Clientes' },
]

function AdminSidebar() {
  const { isProfileLoading, profile, session } = useAuth()

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-head">
        <NavLink to="/admin" className="brand-mark admin-brand">
          <MoonfitBrand
            theme="light"
            title="Moonfit"
            subtitle="Panel administrativo"
            className="admin-brand-lockup"
          />
        </NavLink>
        <p className="admin-sidebar-copy">
          Centro de control para colecciones, pedidos, clientes e inventario de Moonfit.
        </p>
      </div>

      <nav className="admin-nav" aria-label="Administracion">
        {adminLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              ['admin-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-stat">
          <span>Modo</span>
          <strong>Operacion diaria</strong>
        </div>
        <div className="admin-sidebar-stat">
          <span>Sesion</span>
          <strong>
            {isProfileLoading
              ? 'Validando...'
              : profile?.role ?? session?.user.role ?? 'Sin sesion'}
          </strong>
        </div>
        <div className="admin-sidebar-stat">
          <span>Cuenta</span>
          <strong>{profile?.email ?? session?.user.email ?? 'No disponible'}</strong>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar
