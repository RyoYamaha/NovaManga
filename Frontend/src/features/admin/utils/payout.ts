import { isAxiosError } from 'axios'
import type { PayoutRequest } from '@/services/finance.service'

export const VND_PER_COIN = 1_000

export function formatVnd(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}

export function getPayoutTransferCode(requestId: string) {
  const compactId = requestId.replaceAll('-', '').toUpperCase()
  return `NOVAPAY-${compactId.slice(0, 16)}`
}

export function getPayoutQrUrl(request: PayoutRequest) {
  const amountVnd = request.amountCoins * VND_PER_COIN
  if (!Number.isSafeInteger(amountVnd) || amountVnd <= 0) {
    return null
  }

  const query = new URLSearchParams({
    amount: String(amountVnd),
    addInfo: getPayoutTransferCode(request.id),
    accountName: request.bankAccountName,
  })

  return `https://img.vietqr.io/image/${encodeURIComponent(request.bankBin)}-${encodeURIComponent(request.bankAccountNumber)}-compact2.png?${query.toString()}`
}

export function formatCoins(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function getPayoutErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) {
      return message.join(', ')
    }
    if (message) {
      return message
    }
  }

  return fallback
}
