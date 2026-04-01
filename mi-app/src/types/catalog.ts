export type Product = {
  id: string
  slug: string
  name: string
  brand: string
  category: string
  goals: string[]
  price: number
  previousPrice?: number
  stock: number
  badge?: string
  image: string
  description: string
  features: string[]
  expirationDate?: string
  daysUntilExpiration?: number
  isExpired?: boolean
  isExpiringSoon?: boolean
}

export type ProductMutationInput = {
  name: string
  brandId?: string | null
  categoryId?: string | null
  goals?: string[]
  price: number
  previousPrice?: number
  stock: number
  badge?: string
  image?: string
  imageFile?: File | null
  description: string
  features: string[]
  expirationDate?: string | null
}

export type CartItem = {
  product: Product
  quantity: number
}

export type OrderSummary = {
  id: string
  orderNumber?: string
  customer: string
  email: string
  total: number
  status: string
  paymentType?: string
  paymentTypeCode?: string
  paymentMethod: string
  amountPaid?: number
  balanceDue?: number
  dueDate?: string
  rawDueDate?: string
  daysUntilDue?: number
  dueSoon?: boolean
  creditReminderSentAt?: string
  collectionStatus?: string
  payments?: OrderPayment[]
  createdAt: string
  items: string[]
}

export type OrderPayment = {
  id: string
  amount: number
  paymentMethod: string
  reference?: string
  notes?: string
  proofImage?: string
  source: string
  createdAt: string
}

export type CustomerOrderItem = {
  id: string
  quantity: number
  unitPrice: number
  total: number
  product: Product
}

export type CustomerOrder = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerCity?: string
  status: string
  paymentType: string
  paymentMethod: string
  total: number
  subtotal: number
  shipping: number
  amountPaid: number
  balanceDue: number
  dueDate?: string
  collectionStatus: string
  notes?: string
  payments: OrderPayment[]
  createdAt: string
  items: CustomerOrderItem[]
}

export type CustomerProfile = {
  id: string
  name: string
  email: string
  phone?: string
  city?: string
  status: string
  creditApproved: boolean
  creditLimit: number
  creditDays: number
  favorites: Product[]
}

export type StoreCombo = {
  id: string
  title: string
  subtitle: string
  image: string
  price: number
  previousPrice?: number
  ctaLabel: string
  status: string
  items: Array<{
    product: Product
    quantity: number
  }>
}

export type CheckoutCustomer = {
  name: string
  email: string
  phone: string
  city: string
  paymentMethod: string
  paymentType?: string
}

export type CheckoutPayload = {
  customer: CheckoutCustomer
  items: CartItem[]
  shipping: number
  total: number
  notes?: string
}

export type InventoryMovement = {
  id: string
  productId: string
  productName: string
  type: 'entrada' | 'salida' | 'ajuste'
  quantity: number
  reason: string
  createdAt: string
}

export type DashboardMetric = {
  label: string
  value: string
  detail: string
}

export type DashboardTrendPoint = {
  date: string
  orders: number
  revenue: number
}

export type DashboardTopProduct = {
  productId: string
  name: string
  quantity: number
  revenue: number
}

export type DashboardInventoryHealthPoint = {
  label: string
  count: number
}

export type DashboardOrderStatusPoint = {
  status: string
  count: number
}

export type DashboardExpirationAlert = {
  id: string
  name: string
  stock: number
  brand?: string | null
  category?: string | null
  expirationDate: string
  daysUntilExpiration: number
  severity: 'expired' | 'warning'
}

export type DashboardActivity = {
  id: string
  entityType: string
  entityId: string
  action: string
  summary: string
  actorEmail?: string | null
  actorRole?: string | null
  createdAt: string
}

export type DashboardOverview = {
  metrics: {
    revenueTotal: number
    totalOrders: number
    totalCustomers: number
    totalProducts: number
    totalUnits: number
    lowStockProducts: number
    averageOrderValue: number
    ordersLast7Days: number
    revenueLast7Days: number
    expiringSoonProducts: number
    expiredProducts: number
  }
  trends: DashboardTrendPoint[]
  topProducts: DashboardTopProduct[]
  inventoryHealth: DashboardInventoryHealthPoint[]
  orderStatusBreakdown: DashboardOrderStatusPoint[]
  expiringProducts: DashboardExpirationAlert[]
  recentActivity: DashboardActivity[]
}
