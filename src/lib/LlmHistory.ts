import { Storage } from './Storage'
import { generateUuidV4 } from './Util'

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
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

function formatCurrentDateTime(d = new Date()): string {
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
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
