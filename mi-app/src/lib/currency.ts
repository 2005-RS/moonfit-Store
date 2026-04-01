export const CRC_REFERENCE_RATE = 540
export const DEFAULT_SHIPPING_CRC = 6500

const currencyFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function convertUsdLikeAmountToCrc(
  value: number,
  {
    rate = CRC_REFERENCE_RATE,
    rounding = 100,
  }: {
    rate?: number
    rounding?: number
  } = {},
) {
  const convertedValue = value * rate
  return Math.max(0, Math.round(convertedValue / rounding) * rounding)
}
