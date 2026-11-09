import type { DragEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'

export type MangaPageItem =
  | { type: 'existing'; id: string; url: string }
  | { type: 'new'; id: string; file: File; url: string }

interface MangaPageGridProps {
  items: MangaPageItem[]
  draggedItemIndex: number | null
  dragOverItemIndex: number | null
  onDragStart: (event: DragEvent<HTMLDivElement>, index: number) => void
  onDragOver: (event: DragEvent<HTMLDivElement>, index: number) => void
  onDragLeave: () => void
  onDrop: (event: DragEvent<HTMLDivElement>, index: number) => void
  onRemove: (index: number) => void
  onPickImages: (files: FileList | null) => void
}

export function MangaPageGrid({
  items,
  draggedItemIndex,
  dragOverItemIndex,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  onPickImages,
}: MangaPageGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Pages Management ({items.length} pages)
        </h2>
        <span className="text-xs text-muted-foreground">Kéo thả để sắp xếp lại trang</span>
      </div>

      <div className="flex flex-wrap gap-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={(event) => onDragStart(event, index)}
            onDragOver={(event) => onDragOver(event, index)}
            onDragLeave={onDragLeave}
            onDrop={(event) => onDrop(event, index)}
            className={`flex cursor-move flex-col items-center gap-2 transition-all duration-200 ${
              draggedItemIndex === index ? 'scale-95 opacity-50' : 'opacity-100'
            } ${
              dragOverItemIndex === index
                ? 'scale-105 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background'
                : ''
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
              {item.type === 'new' && (
                <span className="rounded bg-primary/20 px-1 text-[9px] font-bold text-primary">Mới</span>
              )}
            </div>
            <div className="group relative flex h-72 w-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
              <img
                src={item.url}
                alt={`Page ${index + 1}`}
                className="pointer-events-none h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Xóa trang ${index + 1}`}
                className="absolute right-1 top-1 rounded bg-background/80 p-1 transition-colors hover:bg-destructive hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        <div className="flex flex-col items-center justify-end gap-2">
          <label
            htmlFor="edit-pages"
            className="group flex h-72 w-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/50 text-primary transition-colors hover:bg-primary/5"
          >
            <ImagePlus className="mb-2 h-6 w-6 text-primary/70 transition-colors group-hover:text-primary" />
            <span className="text-xs font-bold">Thêm ảnh</span>
          </label>
          <input
            id="edit-pages"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => onPickImages(event.target.files)}
          />
        </div>
      </div>
    </div>
  )
}
