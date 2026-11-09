import { Minus, Plus, RotateCcw, BookOpen, ScrollText, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReaderSettings, ReaderTheme, ReaderFont, ReaderMode, LineSpacing, ContentWidth } from '../../types/reader.types'
import { THEME_CONFIGS, FONT_STACKS } from '../../types/reader.types'

interface ReaderSettingsPanelProps {
  settings: ReaderSettings
  hasPdfPages: boolean
  onUpdate: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void
  onReset: () => void
}

/* ── Tham khảo BooksJS (books/lib/booksjs.css):
 *    - Desktop: khung 840 × 594, mỗi trang chiếm 50% khung.
 *    - Mobile: khung 420px, trang chiếm toàn chiều rộng và xếp dọc.
 *    Reader hiện chọn spread theo chiều rộng thực của khung; chế độ cuộn/PDF là lựa chọn riêng.
 * ── */

const THEME_LIST: { id: ReaderTheme; previewBg: string; previewFg: string }[] = [
  { id: 'paper',    previewBg: '#f9f6f0', previewFg: '#23201d' },
  { id: 'sepia',    previewBg: '#f4ebd8', previewFg: '#382e21' },
  { id: 'dark',     previewBg: '#131b26', previewFg: '#f1f5f9' },
  { id: 'midnight', previewBg: '#090b0e', previewFg: '#e2e8f0' },
]

const FONT_LIST: { id: ReaderFont; label: string; cls: string }[] = [
  { id: 'serif', label: 'Aa', cls: 'font-serif' },
  { id: 'sans',  label: 'Aa', cls: 'font-sans' },
  { id: 'mono',  label: 'Aa', cls: 'font-mono' },
]

const MODE_LIST: { id: ReaderMode; icon: React.ElementType; label: string }[] = [
  { id: 'flip',   icon: BookOpen,   label: 'Sách lật' },
  { id: 'scroll', icon: ScrollText, label: 'Cuộn dọc' },
  { id: 'pdf',    icon: FileImage,  label: 'Ảnh PDF' },
]

const SPACING_LIST: { id: LineSpacing; label: string }[] = [
  { id: 'tight',   label: 'Hẹp' },
  { id: 'normal',  label: 'Vừa' },
  { id: 'relaxed', label: 'Rộng' },
]

const WIDTH_LIST: { id: ContentWidth; label: string }[] = [
  { id: 'narrow', label: 'Hẹp' },
  { id: 'normal', label: 'Vừa' },
  { id: 'wide',   label: 'Rộng' },
]

export function ReaderSettingsPanel({
  settings,
  hasPdfPages,
  onUpdate,
  onReset,
}: ReaderSettingsPanelProps) {
  const activeTheme = THEME_CONFIGS[settings.theme]

  return (
    <div
      className="rounded-2xl border p-4 text-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        backgroundColor: activeTheme.cardBg,
        borderColor: activeTheme.border,
        color: activeTheme.ink,
      }}
    >
      {/* ─── Row 1: Reading Mode & Theme ─── */}
      <div className="flex flex-wrap items-start gap-6">
        {/* Reading Mode Selector */}
        <fieldset className="space-y-1.5">
          <legend className="font-semibold opacity-60 text-[11px] uppercase tracking-wider">
            Chế độ đọc
          </legend>
          <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: activeTheme.border }}>
            {MODE_LIST.filter((m) => m.id !== 'pdf' || hasPdfPages).map((mode) => {
              const Icon = mode.icon
              const active = settings.readingMode === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onUpdate('readingMode', mode.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-white/10 opacity-70'
                  }`}
                  title={mode.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Theme Picker */}
        <fieldset className="space-y-1.5">
          <legend className="font-semibold opacity-60 text-[11px] uppercase tracking-wider">
            Màu nền
          </legend>
          <div className="flex items-center gap-2">
            {THEME_LIST.map((t) => {
              const cfg = THEME_CONFIGS[t.id]
              const active = settings.theme === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdate('theme', t.id)}
                  className={`group relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    active ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: t.previewBg }}
                  title={cfg.name}
                >
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: t.previewFg }}
                  >
                    A
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
      </div>

      {/* ─── Row 2: Font, Size, Spacing ─── */}
      <div className="flex flex-wrap items-start gap-6">
        {/* Font Family */}
        <fieldset className="space-y-1.5">
          <legend className="font-semibold opacity-60 text-[11px] uppercase tracking-wider">
            Phông chữ
          </legend>
          <div className="flex items-center gap-1.5">
            {FONT_LIST.map((f) => {
              const active = settings.fontFamily === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onUpdate('fontFamily', f.id)}
                  className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${f.cls} ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-white/10 opacity-70'
                  }`}
                  title={FONT_STACKS[f.id].name}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Font Size */}
        <fieldset className="space-y-1.5">
          <legend className="font-semibold opacity-60 text-[11px] uppercase tracking-wider">
            Cỡ chữ
          </legend>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdate('fontSize', Math.max(14, settings.fontSize - 2))}
              disabled={settings.fontSize <= 14}
              className="rounded-lg p-1.5 border transition-colors hover:bg-white/10 disabled:opacity-30"
              style={{ borderColor: activeTheme.border }}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="tabular-nums font-bold px-1.5 min-w-[3rem] text-center">
              {settings.fontSize}px
            </span>
            <button
              type="button"
              onClick={() => onUpdate('fontSize', Math.min(28, settings.fontSize + 2))}
              disabled={settings.fontSize >= 28}
              className="rounded-lg p-1.5 border transition-colors hover:bg-white/10 disabled:opacity-30"
              style={{ borderColor: activeTheme.border }}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </fieldset>

        {/* Line Spacing */}
        <fieldset className="space-y-1.5">
          <legend className="font-semibold opacity-60 text-[11px] uppercase tracking-wider">
            Dãn dòng
          </legend>
          <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: activeTheme.border }}>
            {SPACING_LIST.map((s) => {
              const active = settings.lineSpacing === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdate('lineSpacing', s.id)}
                  className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-white/10 opacity-70'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Content Width (only relevant for scroll mode) */}
        {settings.readingMode === 'scroll' && (
          <fieldset className="space-y-1.5">
            <legend className="font-semibold opacity-60 text-[11px] uppercase tracking-wider">
              Độ rộng
            </legend>
            <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: activeTheme.border }}>
              {WIDTH_LIST.map((w) => {
                const active = settings.contentWidth === w.id
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onUpdate('contentWidth', w.id)}
                    className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-white/10 opacity-70'
                    }`}
                  >
                    {w.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
      </div>

      {/* ─── Row 3: Quick actions ─── */}
      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: activeTheme.border }}>
        <span className="opacity-50 text-[10px]">Cài đặt được lưu tự động</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 text-[11px] gap-1 opacity-70 hover:opacity-100"
        >
          <RotateCcw className="h-3 w-3" />
          Mặc định
        </Button>
      </div>
    </div>
  )
}
