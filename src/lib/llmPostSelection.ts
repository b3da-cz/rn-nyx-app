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
  const seen = new Set<string>()
  const order: string[] = []
  for (const post of posts) {
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
  for (let index = start; index <= end; index++) {
    const id = order[index]
    const old = prevIndex.get(id)
    const wasInside = old != null && old >= prev.start && old <= prev.end
    if (!wasInside || prevPicked.has(id)) {
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
  if (index < selection.start || index > selection.end) {
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
    picked: selection.order.filter((item, itemIndex) => itemIndex >= selection.start && itemIndex <= selection.end && picked.has(item)),
  }
}
