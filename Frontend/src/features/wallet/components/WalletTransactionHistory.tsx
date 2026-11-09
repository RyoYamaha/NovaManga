import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageJumpInput } from '@/components/common/PageJumpInput'
import type { WalletTransaction } from '@/services/finance.service'

const TRANSACTION_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'deposit', label: 'Nạp tiền' },
  { id: 'purchase', label: 'Mua truyện' },
  { id: 'payout', label: 'Rút tiền' },
  { id: 'bonus', label: 'Khác' },
] as const

type TransactionFilterId = (typeof TRANSACTION_FILTERS)[number]['id']

interface WalletTransactionHistoryProps {
  transactions: WalletTransaction[]
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onRefresh: () => void
}

function formatCoins(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function matchesFilter(transaction: WalletTransaction, filter: TransactionFilterId) {
  if (filter === 'all') return true

  const type = transaction.transactionType.toLowerCase()
  const description = transaction.description.toLowerCase()

  switch (filter) {
    case 'deposit':
      return type.includes('deposit') || type.includes('nap') || description.includes('nạp')
    case 'purchase':
      return type.includes('purchase') || type.includes('pay') || description.includes('mua') || description.includes('purchase')
    case 'payout':
      return type.includes('payout') || type.includes('withdraw') || description.includes('rút') || description.includes('withdraw')
    case 'bonus':
      return !(
        type.includes('deposit') ||
        type.includes('nap') ||
        type.includes('purchase') ||
        type.includes('pay') ||
        description.includes('mua') ||
        description.includes('rút') ||
        description.includes('withdraw') ||
        description.includes('nạp')
      )
  }
}

export function WalletTransactionHistory({
  transactions,
  isLoading,
  isError,
  isFetching,
  page,
  totalPages,
  onPageChange,
  onRefresh,
}: WalletTransactionHistoryProps) {
  const [filter, setFilter] = useState<TransactionFilterId>('all')
  const filteredTransactions = useMemo(
    () => transactions.filter((transaction) => matchesFilter(transaction, filter)),
    [transactions, filter],
  )

  const changeFilter = (nextFilter: TransactionFilterId) => {
    setFilter(nextFilter)
    onPageChange(1)
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Lịch sử coin</h2>
          <p className="text-sm text-muted-foreground">Các giao dịch gần nhất của ví này.</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#131b26] p-2">
        {TRANSACTION_FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => changeFilter(option.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === option.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-white/5 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Đang tải lịch sử...</p>
      ) : isError ? (
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-sm text-destructive">Không tải được lịch sử coin.</p>
          <Button type="button" className="mt-3" size="sm" variant="outline" onClick={onRefresh}>
            Thử lại
          </Button>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Không có giao dịch nào phù hợp với bộ lọc hiện tại.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131b26] shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Thời gian</th>
                <th className="p-4">Loại giao dịch</th>
                <th className="p-4">Mô tả</th>
                <th className="p-4 text-right">Biến động</th>
                <th className="p-4 text-right">Số dư sau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap p-4 text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</td>
                  <td className="p-4 font-semibold text-white">{transaction.transactionType}</td>
                  <td className="max-w-xs truncate p-4 text-xs text-slate-300" title={transaction.description}>
                    {transaction.description}
                  </td>
                  <td className={`whitespace-nowrap p-4 text-right font-black ${transaction.amountCoins > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {transaction.amountCoins > 0 ? '+' : ''}
                    {formatCoins(transaction.amountCoins)}
                  </td>
                  <td className="whitespace-nowrap p-4 text-right font-mono font-bold text-slate-300">
                    {formatCoins(transaction.balanceAfter)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#131b26] p-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Trang trước
          </Button>
          <span className="text-sm text-muted-foreground">
            <PageJumpInput currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Trang sau
          </Button>
        </div>
      )}
    </section>
  )
}
