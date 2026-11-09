function wrapParagraph(
  paragraph: string,
  maxWidth: number,
  measureText: (text: string) => number,
): string[] {
  const trimmed = paragraph.trim()
  if (!trimmed) return ['']

  const words = trimmed.split(/\s+/)
  const lines: string[] = []
  let line = '\u00a0\u00a0'

  for (const word of words) {
    const candidate = line.trim() ? `${line} ${word}` : `${line}${word}`
    if (measureText(candidate) <= maxWidth) {
      line = candidate
      continue
    }

    if (line.trim()) lines.push(line)

    if (measureText(word) > maxWidth) {
      let part = ''
      for (const char of word) {
        if (measureText(part + char) > maxWidth) {
          lines.push(part)
          part = char
        } else {
          part += char
        }
      }
      line = part
    } else {
      line = word
    }
  }

  if (line.trim()) lines.push(line)
  return lines
}

export function paginateNovelText(
  text: string,
  width: number,
  height: number,
  fontFamily: string,
  fontSize: number,
  lineHeightMultiplier: number,
): string[] {
  if (width <= 0 || height <= 0) return []
  if (!text) return ['']

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return [text]

  ctx.font = `${fontSize}px ${fontFamily}`
  const lineHeightPx = fontSize * lineHeightMultiplier
  const maxLinesPerPage = Math.max(1, Math.floor(height / lineHeightPx))
  const rawParagraphs = text.normalize('NFC').split(/\r?\n/)
  const allLines: string[] = []

  rawParagraphs.forEach((paragraph, index) => {
    if (!paragraph.trim()) {
      if (allLines.length > 0 && allLines[allLines.length - 1] !== '') {
        allLines.push('')
      }
      return
    }

    allLines.push(...wrapParagraph(paragraph, width, (value) => ctx.measureText(value).width))
    if (index < rawParagraphs.length - 1) allLines.push('')
  })

  const pages: string[] = []
  for (let index = 0; index < allLines.length; index += maxLinesPerPage) {
    pages.push(allLines.slice(index, index + maxLinesPerPage).join('\n'))
  }

  return pages.length > 0 ? pages : ['']
}
