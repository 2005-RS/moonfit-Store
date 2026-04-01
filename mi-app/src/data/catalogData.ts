import type {
  DashboardMetric,
  OrderSummary,
  Product,
} from '../types/catalog'
import { convertUsdLikeAmountToCrc, formatCurrency } from '../lib/currency'

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'whey-pro-series-vainilla',
    name: 'Whey Pro Series Vainilla',
    brand: 'NutriForge',
    category: 'Proteinas',
    goals: ['Ganar masa muscular', 'Recuperacion'],
    price: convertUsdLikeAmountToCrc(54),
    previousPrice: convertUsdLikeAmountToCrc(64),
    stock: 26,
    badge: 'Oferta',
    image:
      'https://images.unsplash.com/photo-1579722821273-0f6c9d44362f?auto=format&fit=crop&w=900&q=80',
    description:
      'Proteina whey de rapida absorcion para recuperacion muscular y apoyo diario en volumen magro.',
    features: [
      '25 g de proteina por scoop',
      'Baja en azucar',
      'Ideal post-entreno',
    ],
  },
  {
    id: 'p2',
    slug: 'creatina-monohidratada-pure-load',
    name: 'Creatina Monohidratada Pure Load',
    brand: 'Pure Load',
    category: 'Rendimiento',
    goals: ['Fuerza', 'Rendimiento'],
    price: convertUsdLikeAmountToCrc(29),
    previousPrice: convertUsdLikeAmountToCrc(34),
    stock: 31,
    badge: 'Nuevo',
    image:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
    description:
      'Creatina micronizada para fuerza, potencia y mejor desempeno en entrenamientos intensos.',
    features: ['5 g por porcion', 'Sin sabor', 'Mezcla facil'],
  },
  {
    id: 'p3',
    slug: 'set-bandas-resistencia-power-flex',
    name: 'Set Bandas Power Flex',
    brand: 'IronPulse',
    category: 'Implementos',
    goals: ['Home gym', 'Tonificacion'],
    price: convertUsdLikeAmountToCrc(38),
    previousPrice: convertUsdLikeAmountToCrc(46),
    stock: 18,
    badge: 'Combo',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80',
    description:
      'Kit de bandas de resistencia para gluteos, movilidad, activacion y entreno en casa o gimnasio.',
    features: ['5 niveles de tension', 'Incluye bolsa', 'Latex reforzado'],
  },
  {
    id: 'p4',
    slug: 'guantes-training-grip-max',
    name: 'Guantes Training Grip Max',
    brand: 'Titan Gear',
    category: 'Accesorios',
    goals: ['Fuerza', 'Home gym'],
    price: convertUsdLikeAmountToCrc(24),
    stock: 22,
    badge: 'Top ventas',
    image:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80',
    description:
      'Guantes con soporte de muneca y agarre antideslizante para sesiones de fuerza mas seguras.',
    features: ['Palma acolchada', 'Muneca reforzada', 'Secado rapido'],
  },
]

export const featuredCategories = [
  'Proteinas',
  'Rendimiento',
  'Implementos',
  'Accesorios',
  'Ofertas',
]

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: 'Ventas del dia',
    value: formatCurrency(convertUsdLikeAmountToCrc(1240)),
    detail: '+12% vs ayer',
  },
  {
    label: 'Pedidos activos',
    value: '18',
    detail: '6 listos para envio',
  },
  {
    label: 'Productos bajos',
    value: '07',
    detail: 'Stock critico detectado',
  },
]

export const recentOrders: OrderSummary[] = [
  {
    id: 'ORD-2401',
    customer: 'Maria Lopez',
    email: 'maria@email.com',
    total: convertUsdLikeAmountToCrc(54),
    status: 'Pagado',
    paymentMethod: 'Tarjeta',
    createdAt: '2026-03-25 09:10',
    items: ['Whey Pro Series Vainilla'],
  },
  {
    id: 'ORD-2402',
    customer: 'Carlos Vega',
    email: 'carlos@email.com',
    total: convertUsdLikeAmountToCrc(38),
    status: 'Empacando',
    paymentMethod: 'SINPE',
    createdAt: '2026-03-25 10:25',
    items: ['Set Bandas Power Flex'],
  },
  {
    id: 'ORD-2403',
    customer: 'Ana Rojas',
    email: 'ana@email.com',
    total: convertUsdLikeAmountToCrc(29),
    status: 'Enviado',
    paymentMethod: 'Tarjeta',
    createdAt: '2026-03-25 11:45',
    items: ['Creatina Monohidratada Pure Load'],
  },
  {
    id: 'ORD-2404',
    customer: 'Luis Mena',
    email: 'luis@email.com',
    total: convertUsdLikeAmountToCrc(78),
    status: 'Pendiente',
    paymentMethod: 'Transferencia',
    createdAt: '2026-03-25 12:30',
    items: ['Guantes Training Grip Max', 'Whey Pro Series Vainilla'],
  },
]
