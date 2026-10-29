import { llmPostDay, llmPostKey } from './llmPostSelection'

export type SectionLayoutItem = {
  length: number
  offset: number
  index: number
}

export type PostPickerRow = { key: string; index: number }

export type PostPickerGroup = {
  key: string
  day: string
  title: string
  data: PostPickerRow[]
}

export function indexPostsByKey(posts: any[] = []): Map<string, any> {
  const map = new Map<string, any>()
  posts.forEach(post => {
    const key = llmPostKey(post)
    if (key && !map.has(key)) {
      map.set(key, post)
    }
  })
  return map
}

export function groupPostsByDay(
  order: string[],
  byKey: Map<string, any>,
  formatDate: (day: string) => string,
): PostPickerGroup[] {
  const groups: PostPickerGroup[] = []
  order.forEach((key, index) => {
    const post = byKey.get(key)
    if (!post) {
      return
    }
    const day = llmPostDay(post)
    const title = day ? formatDate(day) : '…'
    const row = { key, index }
    const last = groups[groups.length - 1]
    if (last && last.day === day) {
      last.data.push(row)
    } else {
      groups.push({ key: `${day}:${key}`, day, title, data: [row] })
    }
  })
  return groups
}

export function buildSectionListLayoutMap<T>(
  sections: { data: T[] }[],
  headerHeight: number,
  rowHeight: number,
  footerHeight: number = 0,
): SectionLayoutItem[] {
  const map: SectionLayoutItem[] = []
  let offset = 0
  for (const section of sections) {
    map.push({ length: headerHeight, offset, index: map.length })
    offset += headerHeight

    const items = section?.data || []
    for (let i = 0; i < items.length; i++) {
      map.push({ length: rowHeight, offset, index: map.length })
      offset += rowHeight
    }

    map.push({ length: footerHeight, offset, index: map.length })
    offset += footerHeight
  }
  return map
}

export function calculatePopulatedCount(
  offsetY: number,
  viewportHeight: number,
  prevCount: number,
  rowHeight: number = 32,
  buffer: number = 60,
  chunk: number = 50,
): number {
  const approxBottomRow = Math.ceil((offsetY + viewportHeight) / rowHeight)
  const needed = approxBottomRow + buffer
  if (needed <= prevCount) {
    return prevCount
  }
  const next = Math.ceil(needed / chunk) * chunk
  return Math.max(prevCount, next)
}

export function textReachesEnd(excerpt: string, shown: string, lineWidth: number, boxWidth: number): boolean {
  if (!excerpt) {
    return false
  }
  const visible = shown.replace(/\u2026$/, '').replace(/\.\.\.$/, '')
  const clipped = shown !== excerpt && visible !== excerpt
  const filled = boxWidth > 0 && lineWidth >= boxWidth - 1
  return clipped || filled
}
