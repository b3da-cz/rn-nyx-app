export type LlmRangeSelection = {
  order: string[]
  start: number
  end: number
  picked: string[]
}

export function llmPostKey(post: any): string {
  if (!post || post.id == null || post.id === '') {
    return ''
  }
  return String(post.id)
}

export function llmPostDay(post: any): string {
  const raw = post?.inserted_at == null ? '' : String(post.inserted_at)
  const match = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : ''
}

export function llmPostClock(post: any): string {
  const raw = post?.inserted_at == null ? '' : String(post.inserted_at)
  const match = raw.match(/(?:T|\s)(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

export function llmPostOrder(posts: any[] = []): string[] {
  const sorted = [...posts].sort((a, b) => {
    if (a?.id != null && b?.id != null) {
      const numA = Number(a.id)
      const numB = Number(b.id)
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numB - numA
      }
    }
    const aTime = a?.inserted_at || ''
    const bTime = b?.inserted_at || ''
    const timeCmp = bTime.localeCompare(aTime)
    if (timeCmp !== 0) {
      return timeCmp
    }
    return String(b?.id || '').localeCompare(String(a?.id || ''))
  })
  const seen = new Set<string>()
  const order: string[] = []
  for (const post of sorted) {
    const key = llmPostKey(post)
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    order.push(key)
  }
  return order
}

export function initialLlmRangeSelection(order: string[]): LlmRangeSelection {
  if (order.length === 0) {
    return { order, start: 0, end: -1, picked: [] }
  }
  return { order, start: 0, end: order.length - 1, picked: order.slice() }
}

export function syncLlmSelection(prev: LlmRangeSelection, order: string[]): LlmRangeSelection {
  if (prev.order.length === 0 || prev.end < prev.start) {
    return initialLlmRangeSelection(order)
  }
  if (prev.order.length === order.length && prev.order.every((id, index) => id === order[index])) {
    return prev
  }
  const coveredEverything =
    prev.start === 0 && prev.end === prev.order.length - 1 && prev.picked.length === prev.order.length
  if (coveredEverything || order.length === 0) {
    return initialLlmRangeSelection(order)
  }
  let start = order.indexOf(prev.order[prev.start])
  let end = order.indexOf(prev.order[prev.end])
  if (start < 0) {
    start = 0
  }
  if (end < 0) {
    end = order.length - 1
  }
  if (start > end) {
    const swap = start
    start = end
    end = swap
  }
  return applyLlmRange(prev, order, start, end)
}

// Posts that stay inside keep an unchecked hole. Posts that enter from outside are all included.
function applyLlmRange(prev: LlmRangeSelection, order: string[], start: number, end: number): LlmRangeSelection {
  const prevIndex = new Map(prev.order.map((id, index) => [id, index]))
  const prevPicked = new Set(prev.picked)
  const picked: string[] = []
  for (let index = 0; index < order.length; index++) {
    const id = order[index]
    const inNext = index >= start && index <= end
    const old = prevIndex.get(id)
    const wasInside = old != null && old >= prev.start && old <= prev.end
    if (inNext) {
      if (!wasInside || prevPicked.has(id)) {
        picked.push(id)
      }
      continue
    }
    if (prevPicked.has(id) && !wasInside) {
      picked.push(id)
    }
  }
  return { order, start, end, picked }
}

export function pressLlmRange(selection: LlmRangeSelection, index: number): LlmRangeSelection {
  const count = selection.order.length
  if (count === 0 || index < 0 || index >= count) {
    return selection
  }
  if (selection.end < selection.start) {
    return applyLlmRange(selection, selection.order, index, index)
  }
  if (index < selection.start) {
    return applyLlmRange(selection, selection.order, index, selection.end)
  }
  if (index > selection.end) {
    return applyLlmRange(selection, selection.order, selection.start, index)
  }
  const mid = selection.start + (selection.end - selection.start) / 2
  if (index <= mid) {
    return applyLlmRange(selection, selection.order, index, selection.end)
  }
  return applyLlmRange(selection, selection.order, selection.start, index)
}

export function toggleLlmRangePost(selection: LlmRangeSelection, index: number): LlmRangeSelection {
  if (index < 0 || index >= selection.order.length) {
    return selection
  }
  const id = selection.order[index]
  const picked = new Set(selection.picked)
  if (picked.has(id)) {
    picked.delete(id)
  } else {
    picked.add(id)
  }
  return {
    ...selection,
    picked: selection.order.filter(item => picked.has(item)),
  }
}

export function llmPostExcerpt(post: any, limit = 42): string {
  const raw = String(post?.parsed?.clearText || post?.content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!raw) {
    return ''
  }
  if (raw.length <= limit) {
    return raw
  }
  return `${raw.slice(0, limit).trimEnd()}..`
}

export function isContextLengthError(error?: string): boolean {
  if (!error || typeof error !== 'string') {
    return false
  }
  const lower = error.toLowerCase()
  return (
    lower.includes('maximum context length') ||
    lower.includes('context_length_exceeded') ||
    lower.includes('context length exceeded') ||
    lower.includes('reduce the length of the input prompt') ||
    (lower.includes('context length') && (lower.includes('exceed') || lower.includes('limit') || lower.includes('reduce'))) ||
    (lower.includes('context window') &&
      (lower.includes('exceed') || lower.includes('too large') || lower.includes('too long') || lower.includes('limit') || lower.includes('reduce'))) ||
    (lower.includes('input tokens') && (lower.includes('maximum') || lower.includes('exceed') || lower.includes('too large')))
  )
}

export type ContextErrorLimits = {
  maxContext?: number
  outputTokens?: number
  inputTokens?: number
  totalTokens?: number
}

export function parseContextErrorLimits(error?: string): ContextErrorLimits {
  if (!error || typeof error !== 'string') {
    return {}
  }
  const res: ContextErrorLimits = {}

  const maxMatch = error.match(/(?:maximum context length is|context length of|context window of|context length:)\s*(\d+)/i)
  if (maxMatch) {
    res.maxContext = parseInt(maxMatch[1], 10)
  }

  const outMatch = error.match(/requested\s*(\d+)\s*(?:output tokens|tokens in the completion)/i)
  if (outMatch) {
    res.outputTokens = parseInt(outMatch[1], 10)
  }

  const inMatch =
    error.match(/(?:prompt contains at least|value=)\s*(\d+)(?:\s*input tokens)?/i) ||
    error.match(/(\d+)\s*input tokens/i) ||
    error.match(/prompt length \((\d+)\s*tokens\)/i)
  if (inMatch) {
    res.inputTokens = parseInt(inMatch[1], 10)
  }

  const totMatch = error.match(/total of (?:at least\s*)?(\d+)\s*tokens/i)
  if (totMatch) {
    res.totalTokens = parseInt(totMatch[1], 10)
  }

  return res
}

export function llmPostLineLength(post: any): number {
  if (!post) {
    return 0
  }
  const idStr = post.id != null ? `[ID:${post.id}] ` : ''
  const dateStr = post.inserted_at ? `[${post.inserted_at}] ` : ''
  const author = post.username ? `@${post.username}: ` : ''
  const rawContent = String(post.parsed?.clearText || post.content || '').trim()
  const content = rawContent.replace(/\s+/g, ' ')
  return content.length > 0 ? idStr.length + dateStr.length + author.length + content.length : 0
}

export type TrimPostsParams = {
  posts: any[]
  error?: string
  prompt?: string
  systemPrompt?: string
  discussionTitle?: string
  modelId?: string
}

export type TrimmedPostsResult = {
  posts: any[]
  postCount: number
  dateFrom?: string
  dateTo?: string
  trimmedCount: number
}

export function trimPostsToContext(params: TrimPostsParams): TrimmedPostsResult {
  const { posts = [], error, prompt = '', systemPrompt = '', discussionTitle = '' } = params
  if (posts.length === 0) {
    return { posts: [], postCount: 0, trimmedCount: 0 }
  }

  // Chronological order: oldest first (smaller id / earlier timestamp)
  const chronological = [...posts].sort((a, b) => {
    if (a?.id != null && b?.id != null) {
      const numA = Number(a.id)
      const numB = Number(b.id)
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB
      }
    }
    const aTime = a?.inserted_at || ''
    const bTime = b?.inserted_at || ''
    const timeCmp = aTime.localeCompare(bTime)
    if (timeCmp !== 0) {
      return timeCmp
    }
    return String(a?.id || '').localeCompare(String(b?.id || ''))
  })

  const limits = parseContextErrorLimits(error)
  const maxContext = limits.maxContext || 32768
  const outputTokens = limits.outputTokens || Math.min(4096, Math.floor(maxContext * 0.2))
  const availableInput = Math.max(1000, maxContext - outputTokens)
  // Target 85% of available input tokens for safety margin
  const targetInputTokens = Math.floor(availableInput * 0.85)

  let totalPostChars = 0
  for (const post of chronological) {
    totalPostChars += llmPostLineLength(post)
  }

  const fixedChars = prompt.length + (systemPrompt.length || 500) + discussionTitle.length + 1200
  const totalChars = totalPostChars + fixedChars

  let tokenRatio = 0.45
  if (limits.inputTokens && totalChars > 0) {
    const observed = limits.inputTokens / totalChars
    tokenRatio = Math.max(0.35, Math.min(1.2, observed))
  }

  const fixedTokens = Math.ceil(fixedChars * tokenRatio)
  const budgetForPosts = Math.max(200, targetInputTokens - fixedTokens)

  // Accumulate posts from newest (end of chronological) to oldest
  let kept: any[] = []
  let accumulatedTokens = 0

  for (let i = chronological.length - 1; i >= 0; i--) {
    const post = chronological[i]
    const postLen = llmPostLineLength(post)
    const postTokens = Math.max(5, Math.ceil(postLen * tokenRatio) + 4)
    if (kept.length > 0 && accumulatedTokens + postTokens > budgetForPosts) {
      break
    }
    kept.unshift(post)
    accumulatedTokens += postTokens
  }

  // Ensure that we strictly trimmed older posts:
  if (kept.length >= chronological.length && chronological.length > 1) {
    const dropCount = Math.max(1, Math.ceil(chronological.length * 0.2))
    kept = chronological.slice(dropCount)
  }

  const oldestKept = kept[0]
  const newestKept = kept[kept.length - 1]
  const dateFrom = oldestKept ? llmPostDay(oldestKept) || undefined : undefined
  const dateTo = newestKept ? llmPostDay(newestKept) || undefined : undefined

  return {
    posts: kept,
    postCount: kept.length,
    dateFrom,
    dateTo,
    trimmedCount: chronological.length - kept.length,
  }
}

