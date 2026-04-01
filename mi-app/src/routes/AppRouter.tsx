import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import StoreLayout from '../layouts/StoreLayout'
import ProtectedAdminRoute from '../components/auth/ProtectedAdminRoute'
import AdminBrandsPage from '../pages/admin/AdminBrandsPage'
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage'
import AdminCustomersPage from '../pages/admin/AdminCustomersPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminInventoryPage from '../pages/admin/AdminInventoryPage'
import AdminLoginPage from '../pages/admin/AdminLoginPage'
import AdminOrdersPage from '../pages/admin/AdminOrdersPage'
import AdminProductsPage from '../pages/admin/AdminProductsPage'
import AdminCampaignsPage from '../pages/admin/AdminCampaignsPage'
import NotFoundPage from '../pages/NotFoundPage'
import AdminCombosPage from '../pages/admin/AdminCombosPage'
import CartPage from '../pages/store/CartPage'
import CatalogPage from '../pages/store/CatalogPage'
import CustomerAccountPage from '../pages/store/CustomerAccountPage'
import HomePage from '../pages/store/HomePage'
import ProductDetailPage from '../pages/store/ProductDetailPage'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/producto/:slug" element={<ProductDetailPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/cuenta" element={<CustomerAccountPage />} />
          <Route path="/inicio" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route path="/admin" element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="productos" element={<AdminProductsPage />} />
            <Route path="categorias" element={<AdminCategoriesPage />} />
            <Route path="marcas" element={<AdminBrandsPage />} />
            <Route path="combos" element={<AdminCombosPage />} />
            <Route path="promociones" element={<AdminCampaignsPage />} />
            <Route path="pedidos" element={<AdminOrdersPage />} />
            <Route path="inventarios" element={<AdminInventoryPage />} />
            <Route path="clientes" element={<AdminCustomersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
