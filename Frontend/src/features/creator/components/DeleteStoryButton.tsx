import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppDialog } from '@/components/common/AppDialogProvider'
import { authorService } from '@/features/creator/api/author.service'
import { publisherService } from '@/features/creator/api/publisher.service'

interface DeleteStoryButtonProps {
  contentId: string
  title: string
  role: 'author' | 'publisher'
}

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  }
  return 'Không thể xóa truyện. Vui lòng thử lại sau.'
}

export function DeleteStoryButton({ contentId, title, role }: DeleteStoryButtonProps) {
  const { alert, confirm } = useAppDialog()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () =>
      role === 'publisher'
        ? publisherService.deleteContent(contentId)
        : authorService.deleteContent(contentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [role === 'publisher' ? 'publisher-contents' : 'author-contents'] }),
        queryClient.invalidateQueries({ queryKey: ['content', contentId] }),
        queryClient.invalidateQueries({ queryKey: ['contents'] }),
      ])
    },
  })

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Xóa truyện?',
      description: `Bạn có chắc muốn xóa vĩnh viễn "${title}" cùng các chapter và dữ liệu liên quan? Không thể hoàn tác. Truyện có giao dịch mua hoặc bản dịch cộng đồng liên kết sẽ không thể xóa.`,
      confirmLabel: 'Xóa truyện',
      tone: 'destructive',
    })
    if (!confirmed) return

    try {
      await mutation.mutateAsync()
    } catch (error) {
      await alert({
        title: 'Không thể xóa truyện',
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      className="rounded-xl"
      disabled={mutation.isPending}
      onClick={() => void handleDelete()}
      aria-label={`Xóa truyện ${title}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {mutation.isPending ? 'Đang xóa...' : 'Xóa'}
    </Button>
  )
}
