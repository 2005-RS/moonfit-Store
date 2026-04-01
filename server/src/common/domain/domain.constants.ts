export const USER_ROLES = ['ADMIN', 'CUSTOMER'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const RECORD_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const INVENTORY_MOVEMENT_TYPES = ['IN', 'OUT'] as const;
export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPES)[number];

export const PAYMENT_TYPES = ['CASH', 'CREDIT'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const COLLECTION_STATUSES = [
  'PENDING',
  'PARTIAL',
  'PAID',
  'OVERDUE',
] as const;
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];
