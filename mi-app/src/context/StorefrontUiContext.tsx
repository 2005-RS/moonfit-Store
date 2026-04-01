import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '../types/catalog'

type StorefrontUiContextValue = {
  isCartDrawerOpen: boolean
  quickViewProduct: Product | null
  openCartDrawer: () => void
  closeCartDrawer: () => void
  openQuickView: (product: Product) => void
  closeQuickView: () => void
}

const StorefrontUiContext = createContext<StorefrontUiContextValue | null>(null)

export function StorefrontUiProvider({ children }: { children: ReactNode }) {
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  useEffect(() => {
    const hasOverlay = isCartDrawerOpen || Boolean(quickViewProduct)

    document.body.classList.toggle('storefront-overlay-open', hasOverlay)

    return () => {
      document.body.classList.remove('storefront-overlay-open')
    }
  }, [isCartDrawerOpen, quickViewProduct])

  useEffect(() => {
    if (!isCartDrawerOpen && !quickViewProduct) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()

      if (quickViewProduct) {
        setQuickViewProduct(null)
        return
      }

      setIsCartDrawerOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCartDrawerOpen, quickViewProduct])

  const value = useMemo<StorefrontUiContextValue>(
    () => ({
      isCartDrawerOpen,
      quickViewProduct,
      openCartDrawer: () => {
        setQuickViewProduct(null)
        setIsCartDrawerOpen(true)
      },
      closeCartDrawer: () => setIsCartDrawerOpen(false),
      openQuickView: (product) => {
        setIsCartDrawerOpen(false)
        setQuickViewProduct(product)
      },
      closeQuickView: () => setQuickViewProduct(null),
    }),
    [isCartDrawerOpen, quickViewProduct],
  )

  return (
    <StorefrontUiContext.Provider value={value}>
      {children}
    </StorefrontUiContext.Provider>
  )
}

export function useStorefrontUi() {
  const context = useContext(StorefrontUiContext)

  if (!context) {
    throw new Error('StorefrontUiProvider is required to use storefront UI state.')
  }

  return context
}
