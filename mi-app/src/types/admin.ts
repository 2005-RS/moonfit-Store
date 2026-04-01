export type AdminEntityItem = {
  id: string
  name: string
  description: string
  status: string
}

export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type PaginatedResult<T> = {
  data: T[]
  meta: PaginationMeta
}

export type AdminCustomer = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  orders: number
  status: string
  creditApproved: boolean
  creditLimit: number
  creditDays: number
  hasAccount: boolean
}

export type AdminListQuery = {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export type AdminProductListQuery = AdminListQuery & {
  brandId?: string
  categoryId?: string
}

export type AdminOrderListQuery = AdminListQuery & {
  dateFrom?: string
  dateTo?: string
}

export type AdminCampaignPlacement = 'home-hero' | 'home-secondary' | 'catalog-highlight'

export type AdminCampaign = {
  id: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  image: string
  placement: AdminCampaignPlacement
  discountTag: string
  status: 'Activa' | 'Inactiva'
}

export type AdminComboItem = {
  productId: string
  quantity: number
  productName?: string
}

export type AdminCombo = {
  id: string
  title: string
  subtitle: string
  image: string
  price: number
  previousPrice?: number
  ctaLabel: string
  status: 'Activa' | 'Inactiva'
  items: AdminComboItem[]
}
