import { Outlet } from 'react-router-dom'
import StoreFooter from '../components/layout/StoreFooter'
import StoreHeader from '../components/layout/StoreHeader'
import CartDrawer from '../components/store/CartDrawer'
import QuickViewModal from '../components/store/QuickViewModal'

function StoreLayout() {
  return (
    <div className="store-shell">
      <div className="store-announcement">
        <p>
          Moonfit: una seleccion curada, asesoria cercana y una experiencia de
          compra limpia, serena y bien resuelta.
        </p>
      </div>
      <StoreHeader />
      <main className="store-main">
        <Outlet />
      </main>
      <StoreFooter />
      <CartDrawer />
      <QuickViewModal />
    </div>
  )
}

export default StoreLayout
