export type ReaderTheme = 'paper' | 'sepia' | 'dark' | 'midnight'
export type ReaderFont = 'serif' | 'sans' | 'mono'
export type ReaderMode = 'flip' | 'scroll' | 'pdf'
export type LineSpacing = 'tight' | 'normal' | 'relaxed'
export type ContentWidth = 'narrow' | 'normal' | 'wide'

export interface ReaderSettings {
  theme: ReaderTheme
  fontFamily: ReaderFont
  fontSize: number
  lineSpacing: LineSpacing
  readingMode: ReaderMode
  contentWidth: ContentWidth
  showComments: boolean
  zenMode: boolean
}

export interface ThemeConfig {
  id: ReaderTheme
  name: string
  bgStage: string       // Stage / container background
  paper: string         // Book page paper background
  ink: string           // Main text color
  muted: string         // Header/footer/page number color
  border: string        // Book outline border
  spineShadow: string   // Book spine fold gradient
  sheetBorder: string   // Flipped sheet edge border
  cardBg: string        // Popover/toolbar background
}

export const THEME_CONFIGS: Record<ReaderTheme, ThemeConfig> = {
  paper: {
    id: 'paper',
    name: 'Giấy ngà',
    bgStage: '#e8e4db',
    paper: '#f9f6f0',
    ink: '#23201d',
    muted: '#78716c',
    border: '#d6cfc4',
    spineShadow: 'linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.18) 46%, rgba(255,255,255,0.4) 52%, rgba(0,0,0,0.06))',
    sheetBorder: 'rgba(0,0,0,0.08)',
    cardBg: '#f2eee6',
  },
  sepia: {
    id: 'sepia',
    name: 'Vàng Sepia',
    bgStage: '#2c2419',
    paper: '#f4ebd8',
    ink: '#382e21',
    muted: '#7a6750',
    border: '#d5c4aa',
    spineShadow: 'linear-gradient(90deg, rgba(40,28,15,0.1), rgba(40,28,15,0.28) 46%, rgba(255,248,235,0.4) 52%, rgba(40,28,15,0.1))',
    sheetBorder: 'rgba(56,46,33,0.12)',
    cardBg: '#ede2cb',
  },
  dark: {
    id: 'dark',
    name: 'Đêm Xanh',
    bgStage: '#0b0f17',
    paper: '#131b26',
    ink: '#f1f5f9',
    muted: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.1)',
    spineShadow: 'linear-gradient(90deg, rgba(0,0,0,0.3), rgba(0,0,0,0.65) 47%, rgba(255,255,255,0.12) 52%, rgba(0,0,0,0.3))',
    sheetBorder: 'rgba(255,255,255,0.08)',
    cardBg: '#1e293b',
  },
  midnight: {
    id: 'midnight',
    name: 'Đen Tuyền',
    bgStage: '#000000',
    paper: '#090b0e',
    ink: '#e2e8f0',
    muted: '#64748b',
    border: 'rgba(255, 255, 255, 0.06)',
    spineShadow: 'linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,0,0,0.85) 47%, rgba(255,255,255,0.08) 52%, rgba(0,0,0,0.5))',
    sheetBorder: 'rgba(255,255,255,0.05)',
    cardBg: '#11141a',
  },
}

export const FONT_STACKS: Record<ReaderFont, { name: string; stack: string }> = {
  serif: {
    name: 'Sách in (Serif)',
    stack: 'Cambria, Georgia, "Times New Roman", serif',
  },
  sans: {
    name: 'Hiện đại (Sans)',
    stack: '"Segoe UI", Arial, system-ui, sans-serif',
  },
  mono: {
    name: 'Đơn cách (Mono)',
    stack: 'Consolas, "Courier New", monospace',
  },
}

export const LINE_SPACING_VALUES: Record<LineSpacing, number> = {
  tight: 1.6,
  normal: 1.85,
  relaxed: 2.15,
}

export const CONTENT_WIDTH_CLASSES: Record<ContentWidth, string> = {
  narrow: 'max-w-3xl',
  normal: 'max-w-4xl',
  wide: 'max-w-5xl',
}
