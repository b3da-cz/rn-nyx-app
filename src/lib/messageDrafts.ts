import { Storage } from './Storage'

// Textarea drafts. Clubs are keyed by discussion id, mail by username.
// Attachments stay on the Nyx server and are not stored here.

export type DraftBucket = 'club' | 'mail'

export type MessageDraftStore = {
  club: Record<string, string>
  mail: Record<string, string>
}

const PERSIST_DELAY_MS = 300

let memory: MessageDraftStore = emptyMessageDrafts()
let hydrated = false
let hydratePromise: Promise<void> | null = null
let dirty = false
let epoch = 0
let timer: ReturnType<typeof setTimeout> | null = null
let pending: Array<{ bucket: DraftBucket; key: string; text: string }> = []

export function emptyMessageDrafts(): MessageDraftStore {
  return { club: {}, mail: {} }
}

export function clubDraftKey(id?: number | string | null): string {
  const numeric = Number(id)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return ''
  }
  return String(Math.trunc(numeric))
}

export function mailDraftKey(username?: string | null): string {
  return (username || '').trim().toUpperCase()
}

function stringMap(value: any): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return {}
  }
  const out: Record<string, string> = {}
  for (const [key, text] of Object.entries(value)) {
    if (key && typeof text === 'string' && text.trim()) {
      out[key] = text
    }
  }
  return out
}

export function normalizeMessageDrafts(value: any): MessageDraftStore {
  return {
    club: stringMap(value?.club),
    mail: stringMap(value?.mail),
  }
}

export function readDraft(map: Record<string, string> | null | undefined, key: string): string {
  if (!key || !map) {
    return ''
  }
  const text = map[key]
  return typeof text === 'string' ? text : ''
}

export function writeDraft(map: Record<string, string> | null | undefined, key: string, text: string): Record<string, string> {
  const next = { ...(map || {}) }
  if (!key) {
    return next
  }
  if (!text || !text.trim()) {
    delete next[key]
    return next
  }
  next[key] = text
  return next
}

export function applyMailRecipientChange(input: {
  drafts: Record<string, string> | null | undefined
  previousUsername?: string | null
  nextUsername?: string | null
  currentText: string
}): { drafts: Record<string, string>; text: string } {
  const prev = mailDraftKey(input.previousUsername)
  const next = mailDraftKey(input.nextUsername)
  if (prev && prev === next) {
    return { drafts: { ...(input.drafts || {}) }, text: input.currentText }
  }
  const stored = prev ? writeDraft(input.drafts, prev, input.currentText) : { ...(input.drafts || {}) }
  if (!next) {
    return { drafts: stored, text: '' }
  }
  if (!prev && input.currentText.trim()) {
    return { drafts: writeDraft(stored, next, input.currentText), text: input.currentText }
  }
  return { drafts: stored, text: readDraft(stored, next) }
}

function schedulePersist() {
  dirty = true
  const savedEpoch = epoch
  if (timer) {
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
    timer = null
    if (savedEpoch !== epoch) {
      return
    }
    flushMessageDrafts().catch(error => console.warn('message draft', error))
  }, PERSIST_DELAY_MS)
}

function applyPending() {
  const queued = pending
  pending = []
  if (!queued.length) {
    return
  }
  for (const item of queued) {
    memory = { ...memory, [item.bucket]: writeDraft(memory[item.bucket], item.key, item.text) }
  }
  schedulePersist()
}

export function hydrateMessageDrafts(): Promise<void> {
  if (!hydratePromise) {
    hydratePromise = Storage.getMessageDrafts()
      .then(raw => {
        if (!hydrated) {
          memory = normalizeMessageDrafts(raw)
          hydrated = true
          applyPending()
        }
      })
      .catch(error => {
        console.warn('message draft', error)
        if (!hydrated) {
          memory = emptyMessageDrafts()
          hydrated = true
          applyPending()
        }
      })
  }
  return hydratePromise
}

export function readMessageDraft(bucket: DraftBucket, key: string): string {
  return readDraft(memory[bucket], key)
}

export function rememberDraft(bucket: DraftBucket, key: string, text: string) {
  if (!key) {
    return
  }
  if (!hydrated) {
    pending.push({ bucket, key, text })
    return
  }
  memory = { ...memory, [bucket]: writeDraft(memory[bucket], key, text) }
  schedulePersist()
}

export function switchMailDraft(previousUsername: string | undefined, nextUsername: string | undefined, currentText: string): string {
  const applied = applyMailRecipientChange({
    drafts: memory.mail,
    previousUsername,
    nextUsername,
    currentText,
  })
  memory = { ...memory, mail: applied.drafts }
  schedulePersist()
  return applied.text
}

export async function flushMessageDrafts(): Promise<void> {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  await hydrateMessageDrafts()
  if (!dirty) {
    return
  }
  dirty = false
  const savedEpoch = epoch
  const snapshot = memory
  await Storage.setMessageDrafts(snapshot)
  if (savedEpoch !== epoch) {
    dirty = false
  }
}

export function resetMessageDraftMemory() {
  epoch += 1
  if (timer) {
    clearTimeout(timer)
  }
  timer = null
  pending = []
  memory = emptyMessageDrafts()
  hydrated = true
  hydratePromise = Promise.resolve()
  dirty = false
}
