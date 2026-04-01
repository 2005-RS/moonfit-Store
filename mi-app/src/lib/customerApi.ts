import { api } from './api'
import { registerCustomer } from './auth'
import { mapCustomerOrder, mapProduct } from './commerceMappers'
import type { CustomerProfile, Product } from '../types/catalog'
import type { AuthSession } from './auth'

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
  goals?: Array<{ goal: string }>
}

type BackendFavorite = {
  product: BackendProduct
}

type BackendProfile = {
  id: string
  name: string
  email: string
  phone: string | null
  city: string | null
  status: string
  creditApproved: boolean
  creditLimit: number
  creditDays: number
  favorites: BackendFavorite[]
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

function toCustomerProfile(profile: BackendProfile): CustomerProfile {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? undefined,
    city: profile.city ?? undefined,
    status: profile.status,
    creditApproved: profile.creditApproved,
    creditLimit: profile.creditLimit,
    creditDays: profile.creditDays,
    favorites: profile.favorites.map((favorite) => mapProduct(favorite.product)),
  }
}

export async function registerCustomerAccount(payload: {
  name: string
  email: string
  password: string
  phone?: string
  city?: string
}) {
  return registerCustomer(payload)
}

export async function fetchCustomerProfile() {
  const profile = await api.get<BackendProfile>('/customers/me')
  return toCustomerProfile(profile)
}

export async function updateCustomerProfile(payload: {
  name: string
  email: string
  phone: string
  city: string
}) {
  const profile = await api.patch<BackendProfile>('/customers/me', payload)
  return toCustomerProfile(profile)
}

export async function fetchFavoriteProducts() {
  const favorites = await api.get<BackendFavorite[]>('/customers/me/favorites')
  return favorites.map((favorite) => mapProduct(favorite.product))
}

export async function addFavoriteProduct(productId: string) {
  await api.post(`/customers/me/favorites/${productId}`, {})
}

export async function removeFavoriteProduct(productId: string) {
  await api.delete(`/customers/me/favorites/${productId}`)
}

export async function fetchMyOrders() {
  const orders = await api.get<BackendCustomerOrder[]>('/orders/me')
  return orders.map(mapCustomerOrder)
}

export async function reorderOrder(orderId: string) {
  const order = await api.post<BackendCustomerOrder>(`/orders/${orderId}/reorder`, {})
  return mapCustomerOrder(order)
}

export async function reportCustomerPayment(
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

  const order = await api.postForm<BackendCustomerOrder>(
    `/orders/${orderId}/report-payment`,
    body,
  )
  return mapCustomerOrder(order)
}

export type { AuthSession, Product }
