import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { api, API_BASE_URL } from '../lib/api'
import {
  mapCustomerOrder,
  mapInventoryMovement,
  mapOrder,
  mapProduct,
  toApiStatus,
} from '../lib/commerceMappers'
import type {
  CheckoutPayload,
  CustomerOrder,
  InventoryMovement,
  OrderSummary,
  Product,
  ProductMutationInput,
} from '../types/catalog'

type BackendProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  previousPrice: number | null
  stock: number
  badge: string | null
  image: string | null
  status: string
  brand: { id: string; name: string } | null
  category: { id: string; name: string } | null
  expirationDate?: string | null
  goals?: Array<{ goal: string }>
}

type BackendOrder = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  status: string
  paymentType: string
  paymentMethod: string
  total: number
  amountPaid: number
  balanceDue: number
  dueDate: string | null
  collectionStatus: string
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    product: { id: string; name: string }
  }>
  payments?: Array<{
    id: string
    amount: number
    paymentMethod: string
    reference: string | null
    notes: string | null
    proofImage: string | null
    source: string
    createdAt: string
  }>
}

type BackendCustomerOrder = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  customerCity?: string | null
  status: string
  paymentType: string
  paymentMethod: string
  total: number
  subtotal: number
  shipping: number
  amountPaid: number
  balanceDue: number
  dueDate: string | null
  collectionStatus: string
  notes?: string | null
  payments: Array<{
    id: string
    amount: number
    paymentMethod: string
    reference: string | null
    notes: string | null
    proofImage: string | null
    source: string
    createdAt: string
  }>
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    total: number
    product: BackendProduct
  }>
}

type BackendInventoryResponse = {
  summary: {
    totalProducts: number
    totalUnits: number
    lowStockCount: number
  }
  lowStock: BackendProduct[]
  recentMovements: Array<{
    id: string
    productId: string
    type: string
    quantity: number
    reason: string
    createdAt: string
    product: { name: string }
  }>
}

type CommerceContextValue = {
  products: Product[]
  orders: OrderSummary[]
  inventoryMovements: InventoryMovement[]
  isLoading: boolean
  error: string
  refreshCommerce: () => Promise<void>
  createProduct: (input: ProductMutationInput) => Promise<void>
  updateProduct: (productId: string, input: ProductMutationInput) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  createOrder: (payload: CheckoutPayload) => Promise<CustomerOrder>
  updateOrderStatus: (orderId: string, status: string) => Promise<void>
  adjustStock: (productId: string, quantity: number, reason: string) => Promise<void>
}

const CommerceContext = createContext<CommerceContextValue | undefined>(undefined)

type CommerceProviderProps = {
  children: ReactNode
}

function buildProductPayload(input: ProductMutationInput) {
  const body = new FormData()
  const normalizedImageValue = normalizeProductImageValue(input.image)
  body.append('name', input.name.trim())
  body.append(
    'slug',
    input.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),
  )
  body.append('description', input.description.trim())
  body.append('price', String(input.price))
  body.append('stock', String(input.stock))
  body.append('status', 'ACTIVE')

  if (input.previousPrice !== undefined) {
    body.append('previousPrice', String(input.previousPrice))
  }

  if (input.expirationDate !== undefined) {
    body.append('expirationDate', input.expirationDate ?? '')
  }

  if (input.badge?.trim()) {
    body.append('badge', input.badge.trim())
  }

  if (input.brandId) {
    body.append('brandId', input.brandId)
  }

  if (input.categoryId) {
    body.append('categoryId', input.categoryId)
  }

  for (const goal of input.goals ?? []) {
    body.append('goals', goal)
  }

  if (normalizedImageValue) {
    body.append('image', normalizedImageValue)
  }

  if (input.imageFile) {
    body.append('imageFile', input.imageFile)
  }

  return body
}

function normalizeProductImageValue(value?: string) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return ''
  }

  if (trimmedValue.startsWith(`${API_BASE_URL}/uploads/`)) {
    return trimmedValue.replace(API_BASE_URL, '')
  }

  return trimmedValue
}

function CommerceProvider({ children }: CommerceProviderProps) {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshCommerce = async () => {
    setIsLoading(true)
    setError('')

    try {
      const productsResponse = await api.get<BackendProduct[]>('/products')

      setProducts(productsResponse.map(mapProduct))

      if (isAdmin) {
        const [ordersResponse, inventoryResponse] = await Promise.all([
          api.get<BackendOrder[]>('/orders'),
          api.get<BackendInventoryResponse>('/inventory'),
        ])

        setOrders(ordersResponse.map(mapOrder))
        setInventoryMovements(
          inventoryResponse.recentMovements.map(mapInventoryMovement),
        )
      } else {
        setOrders([])
        setInventoryMovements([])
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar los datos del ecommerce.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshCommerce()
  }, [isAdmin])

  const value = useMemo<CommerceContextValue>(
    () => ({
      products,
      orders,
      inventoryMovements,
      isLoading,
      error,
      refreshCommerce,
      createProduct: async (input) => {
        await api.postForm('/products', buildProductPayload(input))
        await refreshCommerce()
      },
      updateProduct: async (productId, input) => {
        await api.patchForm(`/products/${productId}`, buildProductPayload(input))
        await refreshCommerce()
      },
      deleteProduct: async (productId) => {
        await api.delete(`/products/${productId}`)
        await refreshCommerce()
      },
      createOrder: async ({ customer, items, shipping, notes }) => {
        const order = await api.post<BackendCustomerOrder>('/orders', {
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          customerCity: customer.city,
          paymentType:
            customer.paymentMethod.toLowerCase() === 'credito' ? 'CREDIT' : 'CASH',
          paymentMethod: customer.paymentMethod,
          shipping,
          notes,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        })
        await refreshCommerce()
        return mapCustomerOrder(order)
      },
      updateOrderStatus: async (orderId, status) => {
        await api.patch(`/orders/${orderId}/status`, {
          status: toApiStatus(status),
        })
        await refreshCommerce()
      },
      adjustStock: async (productId, quantity, reason) => {
        await api.patch('/inventory/adjust', {
          productId,
          quantity,
          reason,
        })
        await refreshCommerce()
      },
    }),
    [error, inventoryMovements, isLoading, orders, products],
  )

  return (
    <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
  )
}

function useCommerce() {
  const context = useContext(CommerceContext)

  if (!context) {
    throw new Error('useCommerce must be used within a CommerceProvider')
  }

  return context
}

export { CommerceProvider, useCommerce }
