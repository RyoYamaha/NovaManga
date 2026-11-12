import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { publisherService, type PublisherTranslation } from '@/features/creator/api/publisher.service'

interface PublisherTranslationsPanelProps {
  contentId: string
}

export function PublisherTranslationsPanel({ contentId }: PublisherTranslationsPanelProps) {
  const queryClient = useQueryClient()
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const translationsQuery = useQuery({
    queryKey: ['publisher-translations', contentId],
    queryFn: () => publisherService.getTranslations(contentId),
  })
  const visibilityMutation = useMutation({
    mutationFn: ({
      translationId,
      hidden,
      reason,
    }: {
      translationId: string
      hidden: boolean
      reason?: string
    }) => publisherService.setTranslationVisibility(contentId, translationId, hidden, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['publisher-translations', contentId] })
    },
  })

  const translations: PublisherTranslation[] = translationsQuery.data ?? []
  const mutationErrorMessage = isAxiosError<{ message?: string | string[] }>(visibilityMutation.error)
    ? visibilityMutation.error.response?.data?.message
    : undefined

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-[#0b0f17] p-4">
      <div>
        <h3 className="text-sm font-bold text-white">Bản dịch cộng đồng của bộ truyện</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ẩn bản dịch chỉ làm bản dịch không hiển thị với độc giả; tác giả và Admin vẫn có thể xem.
        </p>
      </div>

      {translationsQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Đang tải danh sách bản dịch...</p>
      )}

      {translationsQuery.isError && (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-destructive">Không thể tải danh sách bản dịch.</p>
          <Button size="sm" variant="outline" onClick={() => translationsQuery.refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {!translationsQuery.isLoading && !translationsQuery.isError && translations.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Chưa có bản dịch cộng đồng nào thuộc bộ truyện này.
        </p>
      )}

      {translations.map((translation) => {
        const canChangeVisibility = translation.publicationStatus === 'Published'
        const isUpdating = visibilityMutation.isPending &&
          visibilityMutation.variables?.translationId === translation.id

        return (
          <div
            key={translation.id}
            className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{translation.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {translation.type} · Tác giả: {translation.uploader.username} · {translation._count.chapters} chương
              </p>
              <p className={`mt-1 text-xs ${translation.publisherHidden ? 'text-amber-300' : 'text-emerald-300'}`}>
                {translation.publisherHidden ? 'Đang ẩn với độc giả' : 'Đang hiển thị với độc giả'}
                {!canChangeVisibility && ` · Trạng thái duyệt: ${translation.publicationStatus}`}
              </p>
              {translation.publisherHiddenReason && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Lý do ẩn: {translation.publisherHiddenReason}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:w-64">
              {!translation.publisherHidden && (
                <Input
                  aria-label={`Lý do ẩn bản dịch ${translation.title} (không bắt buộc)`}
                  value={reasons[translation.id] ?? ''}
                  onChange={(event) =>
                    setReasons((current) => ({ ...current, [translation.id]: event.target.value }))
                  }
                  placeholder="Lý do ẩn (không bắt buộc)"
                  maxLength={1000}
                />
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={!canChangeVisibility || visibilityMutation.isPending}
                onClick={() =>
                  visibilityMutation.mutate({
                    translationId: translation.id,
                    hidden: !translation.publisherHidden,
                    reason: reasons[translation.id],
                  })
                }
              >
                {isUpdating ? (
                  <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                ) : translation.publisherHidden ? (
                  <Eye className="mr-1.5 h-4 w-4" />
                ) : (
                  <EyeOff className="mr-1.5 h-4 w-4" />
                )}
                {translation.publisherHidden ? 'Hiện lại' : 'Ẩn bản dịch'}
              </Button>
            </div>
          </div>
        )
      })}

      {visibilityMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {Array.isArray(mutationErrorMessage)
            ? mutationErrorMessage.join(', ')
            : mutationErrorMessage || 'Không thể cập nhật trạng thái bản dịch. Vui lòng thử lại.'}
        </p>
      )}
    </div>
  )
}
