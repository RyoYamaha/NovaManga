import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ContentPurchaseMode } from '@/types/content'

interface Props {
  pricingType: 'free' | 'paid'
  purchaseMode: ContentPurchaseMode
  priceCoins: number
  freeChapters: number
  allowCommunityTranslation: boolean
  priceCoinsError?: string
  freeChaptersError?: string
  onPricingTypeChange: (value: 'free' | 'paid') => void
  onPurchaseModeChange: (value: ContentPurchaseMode) => void
  onPriceCoinsChange: (value: number) => void
  onFreeChaptersChange: (value: number) => void
  onAllowCommunityTranslationChange: (value: boolean) => void
  showCommunityTranslation?: boolean
  showPricing?: boolean
}

export function ContentPricingFields({
  pricingType,
  purchaseMode,
  priceCoins,
  freeChapters,
  allowCommunityTranslation,
  priceCoinsError,
  freeChaptersError,
  onPricingTypeChange,
  onPurchaseModeChange,
  onPriceCoinsChange,
  onFreeChaptersChange,
  onAllowCommunityTranslationChange,
  showCommunityTranslation = false,
  showPricing = true,
}: Props) {
  if (!showPricing) return null

  return (
    <section className="space-y-3 border-t border-border/50 pt-4">
      <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
        Giá và chương đọc thử
      </h3>

      <div className="space-y-1.5">
        <Label htmlFor="pricingType">Hình thức tính phí</Label>
        <select
          id="pricingType"
          value={pricingType === 'free' ? 'free' : purchaseMode}
          onChange={(event) => {
            const value = event.target.value
            if (value === 'free') {
              onPriceCoinsChange(0)
              onPurchaseModeChange('whole')
              onPricingTypeChange('free')
            } else if (value === 'whole' || value === 'chapter_pack') {
              if (!Number.isFinite(priceCoins) || priceCoins < 1) {
                onPriceCoinsChange(50)
              }
              onPurchaseModeChange(value)
              onPricingTypeChange('paid')
            } else {
              return
            }
            if (!Number.isFinite(freeChapters)) {
              onFreeChaptersChange(3)
            }
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="free">Miễn phí</option>
          <option value="whole">Trả phí — mua cả bộ một lần</option>
          <option value="chapter_pack">Trả phí — mua theo gói 10 chương</option>
        </select>
      </div>

      {pricingType === 'paid' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="priceCoins">
              {purchaseMode === 'chapter_pack'
                ? 'Giá mỗi gói 10 chương (coin)'
                : 'Giá mua cả bộ (coin)'}
            </Label>
            <Input
              id="priceCoins"
              type="number"
              min={1}
              step={1}
              value={Number.isNaN(priceCoins) ? '' : priceCoins}
              onChange={(event) => onPriceCoinsChange(event.target.valueAsNumber)}
            />
            {priceCoinsError && (
              <p className="text-xs text-red-600">{priceCoinsError}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="freeChapters">Số chương đọc thử miễn phí</Label>
            <Input
              id="freeChapters"
              type="number"
              min={0}
              step={1}
              value={Number.isNaN(freeChapters) ? '' : freeChapters}
              onChange={(event) => onFreeChaptersChange(event.target.valueAsNumber)}
            />
            {freeChaptersError && (
              <p className="text-xs text-red-600">{freeChaptersError}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Bạn có thể chọn số chương miễn phí để độc giả đọc thử; mặc định là 3,
            nhập 0 nếu không muốn có chương miễn phí.
            {purchaseMode === 'chapter_pack'
              ? ' Gói được chia cố định theo số chương: 1–10, 11–20… Giá trên áp dụng cho mỗi gói.'
              : ' Mua một lần sẽ mở khóa cả bộ, bao gồm các chương đăng sau.'}
          </p>
        </div>
      )}

      {showCommunityTranslation && pricingType === 'free' && (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={allowCommunityTranslation}
            onChange={(event) =>
              onAllowCommunityTranslationChange(event.target.checked)
            }
          />
          <span>
            Cho phép cộng đồng tạo Fan Translation khi truyện đang miễn phí.
          </span>
        </label>
      )}

      {showCommunityTranslation && pricingType === 'paid' && (
        <p className="text-xs text-muted-foreground">
          Khi chuyển sang trả phí, quyền tạo bản dịch mới sẽ tự tắt.
        </p>
      )}
    </section>
  )
}
