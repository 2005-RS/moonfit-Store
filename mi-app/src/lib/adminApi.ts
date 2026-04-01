import { api, API_BASE_URL } from './api'
import { getAuthToken } from './auth'
import {
  mapDashboardActivity,
  mapDashboardTrend,
  mapOrder,
  mapProduct,
  mapAdminCustomer,
  mapAdminEntity,
  mapDashboardTopProduct,
  toApiStatus,
} from './commerceMappers'
import type {
  AdminCampaign,
  AdminCampaignPlacement,
  AdminCombo,
  AdminCustomer,
  AdminEntityItem,
  AdminListQuery,
  AdminOrderListQuery,
  AdminProductListQuery,
  PaginatedResult,
} from '../types/admin'
import type {
  DashboardOverview,
  OrderSummary,
  Product,
  StoreCombo,
} from '../types/catalog'

type BackendEntity = {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
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
  creditReminderSentAt?: string | null
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

type BackendPaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

type BackendPaginatedResponse<T> = {
  data: T[]
  meta: BackendPaginationMeta
}

type BackendDashboardOverview = {
  metrics: DashboardOverview['metrics']
  trends: Array<{
    date: string
    orders: number
    revenue: number
  }>
  topProducts: Array<{
    productId: string
    name: string
    quantity: number
    revenue: number
  }>
  inventoryHealth: DashboardOverview['inventoryHealth']
  orderStatusBreakdown: DashboardOverview['orderStatusBreakdown']
  expiringProducts: DashboardOverview['expiringProducts']
  recentActivity: Array<{
    id: string
    entityType: string
    entityId: string
    action: string
    summary: string
    actorEmail?: string | null
    actorRole?: string | null
    createdAt: string
  }>
}

type BackendCampaign = {
  id: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  image: string
  placement: 'HOME_HERO' | 'HOME_SECONDARY' | 'CATALOG_HIGHLIGHT'
  discountTag: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

type BackendCombo = {
  id: string
  title: string
  subtitle: string
  image: string
  price: number
  previousPrice: number | null
  ctaLabel: string
  status: 'ACTIVE' | 'INACTIVE'
  items: Array<{
    productId: string
    quantity: number
    product: BackendProduct
  }>
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function buildQueryString(query: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const serializedQuery = searchParams.toString()
  return serializedQuery ? `?${serializedQuery}` : ''
}

function toFrontendPlacement(
  placement: BackendCampaign['placement'],
): AdminCampaignPlacement {
  switch (placement) {
    case 'HOME_HERO':
      return 'home-hero'
    case 'HOME_SECONDARY':
      return 'home-secondary'
    case 'CATALOG_HIGHLIGHT':
      return 'catalog-highlight'
    default:
      return 'home-secondary'
  }
}

function toBackendPlacement(placement: AdminCampaignPlacement) {
  switch (placement) {
    case 'home-hero':
      return 'HOME_HERO'
    case 'home-secondary':
      return 'HOME_SECONDARY'
    case 'catalog-highlight':
      return 'CATALOG_HIGHLIGHT'
    default:
      return 'HOME_SECONDARY'
  }
}

function mapCampaign(campaign: BackendCampaign): AdminCampaign {
  return {
    id: campaign.id,
    title: campaign.title,
    subtitle: campaign.subtitle,
    ctaLabel: campaign.ctaLabel,
    ctaHref: campaign.ctaHref,
    image: campaign.image,
    placement: toFrontendPlacement(campaign.placement),
    discountTag: campaign.discountTag ?? '',
    status: campaign.status === 'ACTIVE' ? 'Activa' : 'Inactiva',
  }
}

function mapAdminCombo(combo: BackendCombo): AdminCombo {
  return {
    id: combo.id,
    title: combo.title,
    subtitle: combo.subtitle,
    image: combo.image,
    price: combo.price,
    previousPrice: combo.previousPrice ?? undefined,
    ctaLabel: combo.ctaLabel,
    status: combo.status === 'ACTIVE' ? 'Activa' : 'Inactiva',
    items: combo.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      productName: item.product.name,
    })),
  }
}

function mapStoreCombo(combo: BackendCombo): StoreCombo {
  return {
    id: combo.id,
    title: combo.title,
    subtitle: combo.subtitle,
    image: combo.image,
    price: combo.price,
    previousPrice: combo.previousPrice ?? undefined,
    ctaLabel: combo.ctaLabel,
    status: combo.status,
    items: combo.items.map((item) => ({
      quantity: item.quantity,
      product: mapProduct(item.product),
    })),
  }
}

async function downloadCsv(path: string, filename: string) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new Error('No se pudo exportar el archivo CSV.')
  }

  const csvContent = await response.text()
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const objectUrl = window.URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(objectUrl)
}

export async function fetchCategories() {
  const response = await api.get<BackendEntity[]>('/categories')
  return response.map(mapAdminEntity)
}

export async function createCategory(item: AdminEntityItem) {
  await api.post('/categories', {
    name: item.name.trim(),
    slug: slugify(item.name),
    description: item.description.trim(),
    status: toApiStatus(item.status),
  })
}

export async function updateCategory(id: string, item: AdminEntityItem) {
  await api.patch(`/categories/${id}`, {
    name: item.name.trim(),
    slug: slugify(item.name),
    description: item.description.trim(),
    status: toApiStatus(item.status),
  })
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`)
}

export async function fetchBrands() {
  const response = await api.get<BackendEntity[]>('/brands')
  return response.map(mapAdminEntity)
}

export async function createBrand(item: AdminEntityItem) {
  await api.post('/brands', {
    name: item.name.trim(),
    slug: slugify(item.name),
    description: item.description.trim(),
    status: toApiStatus(item.status),
  })
}

export async function updateBrand(id: string, item: AdminEntityItem) {
  await api.patch(`/brands/${id}`, {
    name: item.name.trim(),
    slug: slugify(item.name),
    description: item.description.trim(),
    status: toApiStatus(item.status),
  })
}

export async function deleteBrand(id: string) {
  await api.delete(`/brands/${id}`)
}

export async function fetchCustomers() {
  const response = await api.get<BackendCustomer[]>('/customers')
  return response.map(mapAdminCustomer)
}

export async function fetchAdminCustomers(query: AdminListQuery = {}) {
  const response = await api.get<BackendPaginatedResponse<BackendCustomer>>(
    `/customers/admin/list${buildQueryString({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status ? toApiStatus(query.status) : undefined,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    })}`,
  )

  return {
    data: response.data.map(mapAdminCustomer),
    meta: response.meta,
  } satisfies PaginatedResult<AdminCustomer>
}

export async function createCustomer(customer: AdminCustomer) {
  await api.post('/customers', {
    name: customer.name.trim(),
    email: customer.email.trim(),
    phone: customer.phone.trim(),
    city: customer.city.trim(),
    status: toApiStatus(customer.status),
    creditApproved: customer.creditApproved,
    creditLimit: customer.creditLimit,
    creditDays: customer.creditDays,
  })
}

export async function updateCustomer(id: string, customer: AdminCustomer) {
  await api.patch(`/customers/${id}`, {
    name: customer.name.trim(),
    email: customer.email.trim(),
    phone: customer.phone.trim(),
    city: customer.city.trim(),
    status: toApiStatus(customer.status),
    creditApproved: customer.creditApproved,
    creditLimit: customer.creditLimit,
    creditDays: customer.creditDays,
  })
}

export async function resetCustomerPassword(id: string, password: string) {
  await api.patch(`/customers/${id}/password`, {
    password,
  })
}

export async function deleteCustomer(id: string) {
  await api.delete(`/customers/${id}`)
}

export async function fetchBrandOptions() {
  return api.get<BackendEntity[]>('/brands')
}

export async function fetchCategoryOptions() {
  return api.get<BackendEntity[]>('/categories')
}

export async function fetchAdminProducts(query: AdminProductListQuery = {}) {
  const response = await api.get<BackendPaginatedResponse<BackendProduct>>(
    `/products/admin/list${buildQueryString({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status ? toApiStatus(query.status) : undefined,
      brandId: query.brandId,
      categoryId: query.categoryId,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    })}`,
  )

  return {
    data: response.data.map(mapProduct),
    meta: response.meta,
  } satisfies PaginatedResult<Product>
}

export async function fetchDiscountedCampaignProducts() {
  const response = await fetchAdminProducts({
    page: 1,
    pageSize: 100,
    status: 'Activa',
    sortBy: 'name',
    sortDirection: 'asc',
  })

  return response.data.filter(
    (product) =>
      product.previousPrice !== undefined && product.previousPrice > product.price,
  )
}

export async function enhanceProductImageWithAi(payload: {
  imageFile?: File | null
  imagePath?: string
  productName?: string
}) {
  const body = new FormData()

  if (payload.imageFile) {
    body.append('imageFile', payload.imageFile)
  }

  if (payload.imagePath?.trim()) {
    body.append('imagePath', payload.imagePath.trim())
  }

  if (payload.productName?.trim()) {
    body.append('productName', payload.productName.trim())
  }

  return api.postForm<{ image: string; message: string }>(
    '/products/admin/enhance-image',
    body,
  )
}

export async function fetchAdminOrders(query: AdminOrderListQuery = {}) {
  const response = await api.get<BackendPaginatedResponse<BackendOrder>>(
    `/orders/admin/list${buildQueryString({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status ? toApiStatus(query.status) : undefined,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    })}`,
  )

  return {
    data: response.data.map(mapOrder),
    meta: response.meta,
  } satisfies PaginatedResult<OrderSummary>
}

export async function runCreditReminders() {
  return api.post<{
    trigger: string
    processed: number
    sent: number
    failed: number
    reminderDays: number
    skipped: boolean
  }>('/orders/admin/credit-reminders/run', {})
}

export function exportProductsCsv() {
  return downloadCsv('/products/admin/export', 'products.csv')
}

export function exportCustomersCsv() {
  return downloadCsv('/customers/admin/export', 'customers.csv')
}

export function exportOrdersCsv() {
  return downloadCsv('/orders/admin/export', 'orders.csv')
}

export async function fetchDashboardOverview() {
  const response = await api.get<BackendDashboardOverview>('/reports/dashboard')

  return {
    metrics: response.metrics,
    trends: response.trends.map(mapDashboardTrend),
    topProducts: response.topProducts.map(mapDashboardTopProduct),
    inventoryHealth: response.inventoryHealth,
    orderStatusBreakdown: response.orderStatusBreakdown,
    expiringProducts: response.expiringProducts,
    recentActivity: response.recentActivity.map(mapDashboardActivity),
  } satisfies DashboardOverview
}

export async function fetchCampaigns() {
  const response = await api.get<BackendCampaign[]>('/campaigns')
  return response.map(mapCampaign)
}

export async function fetchActiveCampaigns() {
  const response = await api.get<BackendCampaign[]>('/campaigns/active')
  return response.map(mapCampaign)
}

export async function createCampaign(campaign: AdminCampaign) {
  await api.post('/campaigns', {
    title: campaign.title.trim(),
    subtitle: campaign.subtitle.trim(),
    ctaLabel: campaign.ctaLabel.trim(),
    ctaHref: campaign.ctaHref.trim(),
    image: campaign.image.trim(),
    placement: toBackendPlacement(campaign.placement),
    discountTag: campaign.discountTag.trim(),
    status: campaign.status === 'Activa' ? 'ACTIVE' : 'INACTIVE',
  })
}

export async function updateCampaign(id: string, campaign: AdminCampaign) {
  await api.patch(`/campaigns/${id}`, {
    title: campaign.title.trim(),
    subtitle: campaign.subtitle.trim(),
    ctaLabel: campaign.ctaLabel.trim(),
    ctaHref: campaign.ctaHref.trim(),
    image: campaign.image.trim(),
    placement: toBackendPlacement(campaign.placement),
    discountTag: campaign.discountTag.trim(),
    status: campaign.status === 'Activa' ? 'ACTIVE' : 'INACTIVE',
  })
}

export async function deleteCampaign(id: string) {
  await api.delete(`/campaigns/${id}`)
}

export async function fetchCombos() {
  const response = await api.get<BackendCombo[]>('/combos')
  return response.map(mapAdminCombo)
}

export async function fetchActiveCombos() {
  const response = await api.get<BackendCombo[]>('/combos/active')
  return response.map(mapStoreCombo)
}

export async function createCombo(combo: AdminCombo) {
  await api.post('/combos', {
    title: combo.title.trim(),
    subtitle: combo.subtitle.trim(),
    image: combo.image.trim(),
    price: combo.price,
    previousPrice: combo.previousPrice ?? null,
    ctaLabel: combo.ctaLabel.trim(),
    status: combo.status === 'Activa' ? 'ACTIVE' : 'INACTIVE',
    items: combo.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  })
}

export async function updateCombo(id: string, combo: AdminCombo) {
  await api.patch(`/combos/${id}`, {
    title: combo.title.trim(),
    subtitle: combo.subtitle.trim(),
    image: combo.image.trim(),
    price: combo.price,
    previousPrice: combo.previousPrice ?? null,
    ctaLabel: combo.ctaLabel.trim(),
    status: combo.status === 'Activa' ? 'ACTIVE' : 'INACTIVE',
    items: combo.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  })
}

export async function deleteCombo(id: string) {
  await api.delete(`/combos/${id}`)
}

export async function recordOrderPayment(
  orderId: string,
  payload: {
    amount: number
    paymentMethod: string
    reference?: string
    notes?: string
    proof?: File | null
  },
) {
  const body = new FormData()
  body.append('amount', String(payload.amount))
  body.append('paymentMethod', payload.paymentMethod)
  if (payload.reference) {
    body.append('reference', payload.reference)
  }
  if (payload.notes) {
    body.append('notes', payload.notes)
  }
  if (payload.proof) {
    body.append('proof', payload.proof)
  }

  return api.postForm(`/orders/${orderId}/payments`, body)
}
