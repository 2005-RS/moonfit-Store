import type { AdminCustomer, AdminEntityItem } from '../types/admin'

export const initialCategories: AdminEntityItem[] = [
  {
    id: 'cat-1',
    name: 'Audio',
    description: 'Audifonos, parlantes y accesorios de sonido.',
    status: 'Activa',
  },
  {
    id: 'cat-2',
    name: 'Wearables',
    description: 'Relojes inteligentes y dispositivos personales.',
    status: 'Activa',
  },
  {
    id: 'cat-3',
    name: 'Combos',
    description: 'Packs promocionales y ventas cruzadas.',
    status: 'Destacada',
  },
]

export const initialBrands: AdminEntityItem[] = [
  {
    id: 'brand-1',
    name: 'NovaSound',
    description: 'Linea enfocada en audio premium y accesorios.',
    status: 'Activa',
  },
  {
    id: 'brand-2',
    name: 'Krono',
    description: 'Marca especializada en wearables y productividad.',
    status: 'Activa',
  },
  {
    id: 'brand-3',
    name: 'VisionGo',
    description: 'Productos para foto, video y creadores.',
    status: 'Nueva',
  },
]

export const initialCustomers: AdminCustomer[] = [
  {
    id: 'CL-100',
    name: 'Maria Lopez',
    email: 'maria@email.com',
    phone: '+506 8888-1111',
    city: 'San Jose',
    orders: 4,
    status: 'Activa',
  },
  {
    id: 'CL-101',
    name: 'Carlos Vega',
    email: 'carlos@email.com',
    phone: '+506 8888-2222',
    city: 'Heredia',
    orders: 2,
    status: 'Frecuente',
  },
  {
    id: 'CL-102',
    name: 'Ana Rojas',
    email: 'ana@email.com',
    phone: '+506 8888-3333',
    city: 'Alajuela',
    orders: 6,
    status: 'VIP',
  },
]
