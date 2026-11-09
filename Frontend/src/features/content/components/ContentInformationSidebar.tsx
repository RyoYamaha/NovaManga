import { Link } from 'react-router'
import type { Chapter } from '@/types/chapter'
import type { ContentDetailData } from '@/types/content'

interface ContentInformationSidebarProps {
  content: ContentDetailData
  publishedChapterCount: number
  latestChapter?: Chapter
  readPath: (chapterId: string) => string
}

export function ContentInformationSidebar({
  content,
  publishedChapterCount,
  latestChapter,
  readPath,
}: ContentInformationSidebarProps) {
  return (
    <div className="space-y-6 lg:col-span-4">
      <section className="space-y-4 rounded-3xl border border-white/10 bg-[#1a2330]/80 p-6 shadow-xl backdrop-blur-xl">
        <h3 className="border-b border-white/5 pb-3 text-base font-bold text-foreground">
          Thông tin tác phẩm
        </h3>

        <dl className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-400">Định dạng:</dt>
            <dd className="font-semibold text-white">
              {content.type === 'Novel' ? 'Tiểu thuyết chữ' : 'Truyện tranh Manga'}
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-slate-400">Tình trạng:</dt>
            <dd className="font-semibold text-white">
              {content.storyStatus === 'Completed' ? 'Đã hoàn thành' : 'Đang tiến hành'}
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-slate-400">Bản quyền:</dt>
            <dd className="font-semibold text-primary">
              {content.ownershipTier === 'Licensed'
                ? 'Bản quyền chính thức'
                : content.ownershipTier === 'Original'
                  ? 'Tác phẩm tự sáng tác'
                  : 'Bản dịch cộng đồng'}
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-slate-400">Người đăng:</dt>
            <dd className="font-semibold text-white">
              <Link
                to={`/profile/${content.uploader?.id ?? content.uploaderId}?role=author`}
                className="transition-colors hover:text-primary"
              >
                {content.uploader?.username || 'Ẩn danh'}
              </Link>
            </dd>
          </div>

          {content.publisher && (
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Nhà xuất bản:</dt>
              <dd className="font-semibold text-primary">
                <Link
                  to={`/profile/${content.publisher.id}?role=publisher`}
                  className="transition-colors hover:text-primary/80"
                >
                  {content.publisher.organizationName}
                </Link>
              </dd>
            </div>
          )}

          <div className="flex items-center justify-between">
            <dt className="text-slate-400">Tổng số chương:</dt>
            <dd className="font-bold text-white">{publishedChapterCount} chương</dd>
          </div>

          {latestChapter && (
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Chương mới nhất:</dt>
              <dd className="font-semibold text-primary">
                <Link to={readPath(latestChapter.id)} className="hover:underline">
                  Chương {latestChapter.number}
                </Link>
              </dd>
            </div>
          )}

          <div className="flex items-center justify-between">
            <dt className="text-slate-400">Hình thức đọc:</dt>
            <dd className="font-semibold text-white">
              {typeof content.priceCoins === 'number' && content.priceCoins > 0
                ? `${content.priceCoins} Coin cho toàn bộ truyện`
                : 'Miễn phí'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-[#1a2330]/80 p-6 shadow-xl backdrop-blur-xl">
        <h3 className="text-base font-bold text-foreground">Tất cả thể loại &amp; thẻ</h3>
        <div className="flex flex-wrap gap-1.5">
          {(content.genres || []).map(({ genre }) => (
            <span
              key={genre.id}
              className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              {genre.name}
            </span>
          ))}
          {(content.tags || []).map(({ tag }) => (
            <span
              key={tag.id}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
