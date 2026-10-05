// '2026-10-04' -> '04.10.2026', '2026-10-04 18:55:03' -> '04.10.2026 18:55:03' (same format as post headers)
export const formatLlmDate = (value?: string): string => {
  if (!value) {
    return ''
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?/)
  if (!match) {
    return value
  }
  const [, year, month, day, time] = match
  return `${day}.${month}.${year}${time ? ` ${time}` : ''}`
}

export const joinMeta = (parts: Array<string | null | undefined | false>): string =>
  parts.filter(part => typeof part === 'string' && part.length > 0).join('  ·  ')

export const formatLlmDateRange = (dateFrom?: string, dateTo?: string): string => {
  if (dateFrom && dateTo) {
    return `${formatLlmDate(dateFrom)} – ${formatLlmDate(dateTo)}`
  }
  if (dateFrom) {
    return `od ${formatLlmDate(dateFrom)}`
  }
  if (dateTo) {
    return `do ${formatLlmDate(dateTo)}`
  }
  return ''
}

export const formatPostCount = (count?: number): string => {
  if (count == null || isNaN(count)) {
    return ''
  }
  if (count === 1) {
    return '1 příspěvek'
  }
  if (count >= 2 && count <= 4) {
    return `${count} příspěvky`
  }
  return `${count} příspěvků`
}
