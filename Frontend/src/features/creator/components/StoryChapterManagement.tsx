import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { ContentDetailData } from '@/types/content'

interface StoryChapterManagementProps {
  contentId: string
  basePath: string
  chapters: ContentDetailData['chapters']
  deletingChapterId?: string
  onDelete: (chapterId: string) => void
}

export function StoryChapterManagement({
  contentId,
  basePath,
  chapters,
  deletingChapterId,
  onDelete,
}: StoryChapterManagementProps) {
  return (
    <section className="mt-8 space-y-4 border-t border-border pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Danh sách chương ({chapters.length})</h2>
        <Button asChild size="sm" className="rounded-xl font-bold">
          <Link to={`${basePath}/content/${contentId}/chapters/new`}>Đăng chapter mới</Link>
        </Button>
      </div>

      {chapters.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          Chưa có chương nào. Hãy đăng chương đầu tiên!
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {chapters.map((chapter) => (
            <li
              key={chapter.id}
              className="flex items-center justify-between p-3 text-sm transition-colors hover:bg-muted/30"
            >
              <div>
                <span className="font-semibold">Chương {chapter.number}</span>
                {chapter.title && (
                  <span className="ml-2 text-muted-foreground">- {chapter.title}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <Link to={`${basePath}/content/${contentId}/chapters/${chapter.id}/edit`}>
                    Sửa
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-destructive hover:bg-destructive hover:text-white"
                  type="button"
                  disabled={
                    chapter.moderationStatus !== 'PendingReview' ||
                    deletingChapterId !== undefined
                  }
                  title={
                    chapter.moderationStatus !== 'PendingReview'
                      ? 'Chỉ có thể xóa chương đang chờ duyệt.'
                      : undefined
                  }
                  onClick={() => onDelete(chapter.id)}
                >
                  {deletingChapterId === chapter.id ? 'Đang xóa...' : 'Xóa'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
