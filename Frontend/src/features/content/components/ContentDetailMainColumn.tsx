import { MessageSquare } from 'lucide-react'
import { CommentSection } from '@/components/comment/CommentSection'
import { AiNovelBanner } from '@/features/ai/components/AiNovelBanner'
import { ChapterList } from '@/features/content/components/ChapterList'
import { ContentSynopsis } from '@/features/content/components/ContentSynopsis'
import type { ContentDetailData } from '@/types/content'

interface ContentDetailMainColumnProps {
  content: ContentDetailData
  isReader: boolean
  publishedChapters: ContentDetailData['chapters']
  completedChapterIds: Set<string>
  lastChapterId?: string
}

export function ContentDetailMainColumn({
  content,
  isReader,
  publishedChapters,
  completedChapterIds,
  lastChapterId,
}: ContentDetailMainColumnProps) {
  return (
    <div className="space-y-8 lg:col-span-8">
      {content.type === 'Novel' && isReader && (
        <AiNovelBanner
          novelId={content.id}
          novelTitle={content.title}
          genres={content.genres?.map((genre) => genre.genre.name)}
          chapterCount={content.chapters.length}
          freeChapters={content.freeChapters}
        />
      )}

      <ContentSynopsis synopsis={content.synopsis} />

      <ChapterList
        chapters={publishedChapters}
        completedChapterIds={completedChapterIds}
        lastChapterId={lastChapterId}
        contentId={content.id}
        contentType={content.type}
      />

      <section className="space-y-6 rounded-3xl border border-white/10 bg-[#1a2330]/80 p-6 shadow-xl backdrop-blur-xl sm:p-7">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Bình luận & Thảo luận</h2>
            <p className="text-xs text-slate-400">
              Chia sẻ cảm nhận và giao lưu cùng cộng đồng độc giả
            </p>
          </div>
        </div>
        <CommentSection contentId={content.id} variant="embedded" />
      </section>
    </div>
  )
}
