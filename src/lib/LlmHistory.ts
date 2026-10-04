import { Storage } from './Storage'

export type LlmHistoryItem = {
  id: string
  createdAt: string
  discussionId: number | string
  discussionTitle: string
  modelId: string
  modelName?: string
  dateFrom?: string
  dateTo?: string
  postCount: number
  prompt: string
  response: string
  durationMs?: number
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export function formatDuration(durationMs?: number): string {
  if (durationMs == null || isNaN(durationMs)) {
    return ''
  }
  if (durationMs < 1000) {
    return `${durationMs} ms`
  }
  return `${(durationMs / 1000).toFixed(1)} s`
}

function formatCurrentDateTime(d = new Date()): string {
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function generateUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function getLlmHistory(): Promise<LlmHistoryItem[]> {
  try {
    const list = await Storage.getLlmHistory()
    return Array.isArray(list) ? list : []
  } catch (e) {
    console.warn('Failed to load LLM history', e)
    return []
  }
}

export async function addLlmHistoryEntry(
  item: Omit<LlmHistoryItem, 'id' | 'createdAt'>,
): Promise<LlmHistoryItem> {
  const fullItem: LlmHistoryItem = {
    id: generateUuidV4(),
    createdAt: formatCurrentDateTime(),
    ...item,
  }

  const existing = await getLlmHistory()
  // Newest items first, limit to e.g. 500 entries
  const updated = [fullItem, ...existing].slice(0, 500)
  await Storage.setLlmHistory(updated)
  return fullItem
}

export async function deleteLlmHistoryEntry(id: string): Promise<LlmHistoryItem[]> {
  const existing = await getLlmHistory()
  const updated = existing.filter(it => it.id !== id)
  await Storage.setLlmHistory(updated)
  return updated
}

export async function clearLlmHistory(): Promise<void> {
  await Storage.setLlmHistory([])
}
