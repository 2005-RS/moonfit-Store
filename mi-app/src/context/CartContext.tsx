import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useCommerce } from './CommerceContext'
import type { CartItem, Product } from '../types/catalog'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addToCart: (product: Product) => boolean
  addBundleToCart: (bundle: Array<{ product: Product; quantity: number }>) => boolean
  decreaseQuantity: (productId: string) => void
  increaseQuantity: (productId: string) => boolean
  removeFromCart: (productId: string) => void
  clearCart: () => void
  isInCart: (productId: string) => boolean
  getAvailableStock: (productId: string) => number
}

const STORAGE_KEY = 'moonfit-cart'

const CartContext = createContext<CartContextValue | undefined>(undefined)

type CartProviderProps = {
  children: ReactNode
}

function CartProvider({ children }: CartProviderProps) {
  const { products } = useCommerce()
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return []
    }

    try {
      return JSON.parse(stored) as CartItem[]
    } catch {
      return []
    }
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    setItems((currentItems) =>
      currentItems.flatMap((item) => {
        const product = products.find((productItem) => productItem.id === item.product.id)

        if (!product || product.stock <= 0) {
          return []
        }

        return {
          ...item,
          product,
          quantity: Math.min(item.quantity, product.stock),
        }
      }),
    )
  }, [products])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    )

    const getAvailableStock = (productId: string) =>
      products.find((product) => product.id === productId)?.stock ?? 0

    const addToCart = (product: Product) => {
      const availableStock = getAvailableStock(product.id)
      const currentQuantity =
        items.find((item) => item.product.id === product.id)?.quantity ?? 0

      if (currentQuantity >= availableStock) {
        return false
      }

      setItems((currentItems) => {
        const existingItem = currentItems.find(
          (item) => item.product.id === product.id,
        )

        if (!existingItem) {
          return [...currentItems, { product, quantity: 1 }]
        }

        return currentItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      })

      return true
    }

    const addBundleToCart = (bundle: Array<{ product: Product; quantity: number }>) => {
      const canApplyBundle = bundle.every(({ product, quantity }) => {
        const availableStock = getAvailableStock(product.id)
        const currentQuantity =
          items.find((item) => item.product.id === product.id)?.quantity ?? 0

        return currentQuantity + quantity <= availableStock
      })

      if (!canApplyBundle) {
        return false
      }

      setItems((currentItems) => {
        const nextItems = [...currentItems]

        bundle.forEach(({ product, quantity }) => {
          const existingIndex = nextItems.findIndex(
            (item) => item.product.id === product.id,
          )

          if (existingIndex === -1) {
            nextItems.push({ product, quantity })
            return
          }

          nextItems[existingIndex] = {
            ...nextItems[existingIndex],
            quantity: nextItems[existingIndex].quantity + quantity,
          }
        })

        return nextItems
      })

      return true
    }

    const increaseQuantity = (productId: string) => {
      const availableStock = getAvailableStock(productId)
      const currentQuantity =
        items.find((item) => item.product.id === productId)?.quantity ?? 0

      if (currentQuantity >= availableStock) {
        return false
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      )

      return true
    }

    const decreaseQuantity = (productId: string) => {
      setItems((currentItems) =>
        currentItems.flatMap((item) => {
          if (item.product.id !== productId) {
            return item
          }

          if (item.quantity === 1) {
            return []
          }

          return { ...item, quantity: item.quantity - 1 }
        }),
      )
    }

    const removeFromCart = (productId: string) => {
      setItems((currentItems) =>
        currentItems.filter((item) => item.product.id !== productId),
      )
    }

    const clearCart = () => {
      setItems([])
    }

    const isInCart = (productId: string) =>
      items.some((item) => item.product.id === productId)

    return {
      items,
      itemCount,
      subtotal,
      addToCart,
      addBundleToCart,
      decreaseQuantity,
      increaseQuantity,
      removeFromCart,
      clearCart,
      isInCart,
      getAvailableStock,
    }
  }, [items, products])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}

export { CartProvider, useCart }
