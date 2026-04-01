import type {
  AdminCustomer,
  AdminEntityItem,
} from '../types/admin'
import { API_BASE_URL } from './api'
import { DEFAULT_SHIPPING_CRC } from './currency'
import type {
  DashboardActivity,
  DashboardTopProduct,
  DashboardTrendPoint,
  CheckoutCustomer,
  CustomerOrder,
  InventoryMovement,
  OrderPayment,
  OrderSummary,
  Product,
} from '../types/catalog'

type BackendBrand = {
  id: string
  name: string
  slug?: string
  description?: string | null
  status?: string
}

type BackendCategory = {
  id: string
  name: string
  slug?: string
  description?: string | null
  status?: string
}

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
  brand: BackendBrand | null
  category: BackendCategory | null
  expirationDate?: string | null
  goals?: Array<{ goal: string }>
}

type BackendOrderItem = {
  id: string
  quantity: number
  product: {
    id: string
    name: string
  }
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
  creditReminderSentAt?: string | null
  collectionStatus: string
  createdAt: string
  items: BackendOrderItem[]
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

type BackendCustomerOrderItem = {
  id: string
  quantity: number
  unitPrice: number
  total: number
  product: BackendProduct
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
  items: BackendCustomerOrderItem[]
}

type BackendInventoryMovement = {
  id: string
  productId: string
  type: string
  quantity: number
  reason: string
  createdAt: string
  product: {
    name: string
  }
}

type BackendCustomer = {
  id: string
  name: string
  email: string
  phone: string | null
  city: string | null
  status: string
  creditApproved?: boolean
  creditLimit?: number
  creditDays?: number
  user?: { id: string } | null
  orders?: Array<{ id: string }>
}

const fallbackProductImage =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'

function resolveImageUrl(value?: string | null) {
  if (!value) {
    return fallbackProductImage
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`
  }

  return value
}

const statusLabelMap: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PROCESSING: 'Procesando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  PARTIAL: 'Parcial',
  OVERDUE: 'Vencido',
  VIP: 'VIP',
  FREQUENT: 'Frecuente',
}

const statusCodeMap: Record<string, string> = {
  Pendiente: 'PENDING',
  Pagado: 'PAID',
  Empacando: 'PROCESSING',
  Procesando: 'PROCESSING',
  Enviado: 'SHIPPED',
  Entregado: 'DELIVERED',
  Cancelado: 'CANCELLED',
  Activa: 'ACTIVE',
  Inactiva: 'INACTIVE',
  VIP: 'VIP',
  Frecuente: 'FREQUENT',
}

function formatDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function toDisplayStatus(status: string) {
  return statusLabelMap[status] ?? status
}

function toDisplayPaymentType(paymentType: string) {
  return paymentType === 'CREDIT' ? 'Credito' : 'Contado'
}

function getDaysUntilDate(value: string) {
  const targetDate = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getDaysUntilDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const targetUtc = Date.UTC(year, month - 1, day)
  const now = new Date()
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24))
}

function mapOrderPayment(payment: NonNullable<BackendOrder['payments']>[number]): OrderPayment {
  return {
    id: payment.id,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    reference: payment.reference ?? undefined,
    notes: payment.notes ?? undefined,
    proofImage: payment.proofImage
      ? `${API_BASE_URL}${payment.proofImage}`
      : undefined,
    source: payment.source,
    createdAt: formatDate(payment.createdAt),
  }
}

export function toApiStatus(status: string) {
  return statusCodeMap[status] ?? status.toUpperCase()
}

export function mapProduct(product: BackendProduct): Product {
  const expirationDate = product.expirationDate ?? undefined
  const daysUntilExpiration = expirationDate
    ? getDaysUntilDateKey(expirationDate)
    : undefined

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand?.name ?? 'Sin marca',
    category: product.category?.name ?? 'Sin categoria',
    goals: product.goals?.map((goal) => goal.goal) ?? [],
    price: product.price,
    previousPrice: product.previousPrice ?? undefined,
    stock: product.stock,
    badge: product.badge ?? undefined,
    image: resolveImageUrl(product.image),
    description: product.description ?? 'Producto sin descripcion registrada.',
    features: [],
    expirationDate,
    daysUntilExpiration,
    isExpired: daysUntilExpiration !== undefined && daysUntilExpiration < 0,
    isExpiringSoon:
      daysUntilExpiration !== undefined &&
      daysUntilExpiration >= 0 &&
      daysUntilExpiration <= 15,
  }
}

export function mapOrder(order: BackendOrder): OrderSummary {
  const paymentTypeCode = order.paymentType === 'CREDIT' ? 'CREDIT' : 'CASH'
  const daysUntilDue =
    order.dueDate && paymentTypeCode === 'CREDIT' ? getDaysUntilDate(order.dueDate) : undefined

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customer: order.customerName,
    email: order.customerEmail,
    total: order.total,
    status: toDisplayStatus(order.status),
    paymentType: toDisplayPaymentType(order.paymentType),
    paymentTypeCode,
    paymentMethod: order.paymentMethod,
    amountPaid: order.amountPaid,
    balanceDue: order.balanceDue,
    dueDate: order.dueDate ? formatDate(order.dueDate) : undefined,
    rawDueDate: order.dueDate ?? undefined,
    daysUntilDue,
    dueSoon: daysUntilDue !== undefined && daysUntilDue >= 0 && daysUntilDue <= 3,
    creditReminderSentAt: order.creditReminderSentAt
      ? formatDate(order.creditReminderSentAt)
      : undefined,
    collectionStatus: toDisplayStatus(order.collectionStatus),
    payments: order.payments?.map(mapOrderPayment) ?? [],
    createdAt: formatDate(order.createdAt),
    items: order.items.map(
      (item) => `${item.product.name} x${item.quantity}`,
    ),
  }
}

export function mapCustomerOrder(order: BackendCustomerOrder): CustomerOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone ?? undefined,
    customerCity: order.customerCity ?? undefined,
    status: order.status,
    paymentType: order.paymentType,
    paymentMethod: order.paymentMethod,
    total: order.total,
    subtotal: order.subtotal,
    shipping: order.shipping,
    amountPaid: order.amountPaid,
    balanceDue: order.balanceDue,
    dueDate: order.dueDate ?? undefined,
    collectionStatus: order.collectionStatus,
    notes: order.notes ?? undefined,
    payments: order.payments.map(mapOrderPayment),
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      product: mapProduct(item.product),
    })),
  }
}

export function mapInventoryMovement(
  movement: BackendInventoryMovement,
): InventoryMovement {
  return {
    id: movement.id,
    productId: movement.productId,
    productName: movement.product.name,
    type: movement.type === 'IN' ? 'entrada' : 'salida',
    quantity: movement.quantity,
    reason: movement.reason,
    createdAt: formatDate(movement.createdAt),
  }
}

export function mapAdminEntity(item: BackendBrand | BackendCategory): AdminEntityItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    status: toDisplayStatus(item.status ?? 'ACTIVE'),
  }
}

export function mapAdminCustomer(customer: BackendCustomer): AdminCustomer {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? '',
    city: customer.city ?? '',
    orders: customer.orders?.length ?? 0,
    status: toDisplayStatus(customer.status),
    creditApproved: customer.creditApproved ?? false,
    creditLimit: customer.creditLimit ?? 0,
    creditDays: customer.creditDays ?? 0,
    hasAccount: Boolean(customer.user?.id),
  }
}

export function buildOrderPayload(customer: CheckoutCustomer, items: Product[]) {
  const shipping =
    customer.paymentMethod.toLowerCase() === 'credito' || items.length === 0
      ? 0
      : DEFAULT_SHIPPING_CRC

  return {
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    customerCity: customer.city,
    paymentType: customer.paymentType,
    paymentMethod: customer.paymentMethod,
    shipping,
    items: items.map((product) => ({
      productId: product.id,
      quantity: 1,
    })),
  }
}

export function mapDashboardTrend(trend: DashboardTrendPoint) {
  return trend
}

export function mapDashboardTopProduct(product: DashboardTopProduct) {
  return product
}

export function mapDashboardActivity(activity: DashboardActivity) {
  return {
    ...activity,
    createdAt: formatDate(activity.createdAt),
  }
}
