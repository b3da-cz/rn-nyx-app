export type DiscussionRequestLink = { id: number; name: string }

export type DiscussionRequestView = {
  name: string
  category: string
  summary: string
  similar: string
  links: DiscussionRequestLink[]
  discussionId: number | null
  canVote: boolean
  votesFor: number
  votesAgainst: number
  cancelled: boolean
}

const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const plainDiscussionText = (value: unknown) =>
  String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

export const discussionRequestLinks = (html: string): DiscussionRequestLink[] => {
  const links: DiscussionRequestLink[] = []
  const re = /href\s*=\s*["']\/discussion\/(\d+)[^"']*["'][^>]*>([^<]+)</gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const name = plainDiscussionText(match[2])
    if (name) {
      links.push({ id: Number(match[1]), name })
    }
  }
  return links
}

const countOf = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const fromFields = (fields: {
  name?: unknown
  category?: unknown
  summary?: unknown
  similar?: unknown
  discussionId?: unknown
  canVote?: unknown
  votesFor?: unknown
  votesAgainst?: unknown
  cancelled?: unknown
}): DiscussionRequestView => {
  const discussionId = countOf(fields.discussionId) || null
  const cancelled = fields.cancelled === true
  const similarHtml = String(fields.similar ?? '')
  return {
    name: plainDiscussionText(fields.name) || '-',
    category: plainDiscussionText(fields.category) || '-',
    summary: plainDiscussionText(fields.summary) || '-',
    similar: plainDiscussionText(similarHtml),
    links: discussionRequestLinks(similarHtml),
    discussionId,
    canVote: fields.canVote !== false && !discussionId && !cancelled,
    votesFor: countOf(fields.votesFor),
    votesAgainst: countOf(fields.votesAgainst),
    cancelled,
  }
}

const fromData = (data: any): DiscussionRequestView =>
  fromFields({
    name: data?.name_static,
    category: data?.category_path,
    summary: data?.summary,
    similar: data?.similar_discussions,
    discussionId: data?.discussion_id,
    canVote: data?.can_vote,
    votesFor: data?.computed_values?.voters_positive_total,
    votesAgainst: data?.computed_values?.voters_negative_total,
    cancelled: data?.cancelled,
  })

const rowsFromHtml = (html: string) => {
  const rows: { label: string; value: string }[] = []
  const re = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<td[^>]*>([\s\S]*?)(?=<tr\b|<\/table|$)/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    rows.push({ label: plainDiscussionText(match[1]), value: match[2] })
  }
  return rows
}

const fromHtml = (html: string): DiscussionRequestView => {
  const fields: Record<string, string> = {}
  for (const row of rowsFromHtml(html)) {
    const label = fold(row.label)
    if (!label || label === 'akce') {
      continue
    }
    if (label.startsWith('nazev')) fields.name = row.value
    else if (label.startsWith('kategorie')) fields.category = row.value
    else if (label.startsWith('popis')) fields.summary = row.value
    else if (label.includes('podob')) fields.similar = row.value
  }
  const nameLinks = discussionRequestLinks(fields.name || '')
  return fromFields({
    name: fields.name,
    category: fields.category,
    summary: fields.summary,
    similar: fields.similar,
    discussionId: nameLinks[0]?.id,
    canVote: /name\s*=\s*["']?vote_for\b/i.test(html),
    cancelled: false,
  })
}

export const discussionRequestFromPost = (post: any): DiscussionRequestView | null => {
  const data = post?.content_raw?.data
  const typed = post?.content_raw?.type === 'discussion_request' || post?.post_type === 'discussion_request'
  const html = post?.parsed?.discussionRequest || ''
  if (!typed && !html) {
    return null
  }
  if (data && typeof data === 'object') {
    return fromData(data)
  }
  if (html || post?.content) {
    return fromHtml(html || post.content)
  }
  return null
}

// Labels, gaps, and the vote row sit on top of the measured name, category, summary, and similar text.
export const discussionRequestBlockHeight = (request: DiscussionRequestView, textHeight: number, fontScale = 1) => {
  const sections = request.discussionId ? 3 : 4
  const labels = sections * 22 * fontScale
  const gaps = sections * 10 * fontScale
  const actions = (request.canVote ? 126 : 28) * fontScale
  const linkRows = request.discussionId ? 0 : request.links.length * 24 * fontScale
  return textHeight + labels + gaps + actions + linkRows + 8 * fontScale
}
