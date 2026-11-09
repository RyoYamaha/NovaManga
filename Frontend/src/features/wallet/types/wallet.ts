export interface DepositOrderDisplay {
  id: string
  expectedAmount: number
  expectedCoins: number
  paidAmount: number | null
  paidCoins: number | null
  status: string
  transferCode: string
  expiresAt: string
  isExpired: boolean
  bankName?: string
  bankAccountNumber?: string
  bankAccountName?: string
  qrUrl?: string
}
