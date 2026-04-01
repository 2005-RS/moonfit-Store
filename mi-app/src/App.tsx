import './App.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CommerceProvider } from './context/CommerceContext'
import { FeedbackProvider } from './context/FeedbackContext'
import { StorefrontUiProvider } from './context/StorefrontUiContext'
import AppRouter from './routes/AppRouter'

function App() {
  return (
    <FeedbackProvider>
      <AuthProvider>
        <CommerceProvider>
          <CartProvider>
            <StorefrontUiProvider>
              <AppRouter />
            </StorefrontUiProvider>
          </CartProvider>
        </CommerceProvider>
      </AuthProvider>
    </FeedbackProvider>
  )
}

export default App
