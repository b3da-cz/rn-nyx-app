import { Storage } from './Storage'
import { t } from './Strings'

export const LUMO_BASE_URL = 'https://lumo-api.proton.me/ai/v1'
export const LUMO_MODEL_ID = 'lumo'
export const LUMO_MODEL_NAME = 'Lumo'
export const LUMO_CONTEXT_TOKENS = 32_768
export const LUMO_MAX_RPD = 500
export const LUMO_MAX_RPM = 20
export const LUMO_RPM_WINDOW_MS = 60_000

export type LumoQuotaState = {
  day: string
  dayCount: number
  stamps: number[]
}

export type LumoQuotaSnapshot = {
  rpdUsed: number
  rpmUsed: number
  rpdMax: number
  rpmMax: number
}

type LumoClaim =
  | { ok: true; state: LumoQuotaState }
  | { ok: false; limit: 'rpd' | 'rpm'; state: LumoQuotaState }

const listeners = new Set<(snapshot: LumoQuotaSnapshot) => void>()
let memory: LumoQuotaState | null = null
let chain: Promise<unknown> = Promise.resolve()

export function lumoDayKey(now: Date): string {
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function emptyLumoQuota(now = new Date()): LumoQuotaState {
  return { day: lumoDayKey(now), dayCount: 0, stamps: [] }
}

// The day counter uses the phone's local midnight. RPM is a sliding minute, so it also drops as requests age out.
export function normalizeLumoQuota(raw: unknown, now = new Date()): LumoQuotaState {
  const day = lumoDayKey(now)
  const cutoff = now.getTime() - LUMO_RPM_WINDOW_MS
  const source = raw && typeof raw === 'object' ? (raw as Partial<LumoQuotaState>) : null
  const stamps = Array.isArray(source?.stamps)
    ? source.stamps.filter(ts => typeof ts === 'number' && ts > cutoff && ts <= now.getTime() + 1000)
    : []
  const dayCount =
    source?.day === day && typeof source.dayCount === 'number' && source.dayCount > 0 ? Math.floor(source.dayCount) : 0
  return { day, dayCount, stamps }
}

export function lumoQuotaSnapshot(state: LumoQuotaState, now = new Date()): LumoQuotaSnapshot {
  const normalized = normalizeLumoQuota(state, now)
  return {
    rpdUsed: normalized.dayCount,
    rpmUsed: normalized.stamps.length,
    rpdMax: LUMO_MAX_RPD,
    rpmMax: LUMO_MAX_RPM,
  }
}

export function lumoQuotaPercentLabel(used: number, max: number): string {
  if (max <= 0 || used <= 0) {
    return '0%'
  }
  const raw = (used / max) * 100
  if (raw < 1) {
    return '<1%'
  }
  return `${Math.min(100, Math.round(raw))}%`
}

export function lumoQuotaBarRatio(used: number, max: number): number {
  if (max <= 0 || used <= 0) {
    return 0
  }
  return Math.min(1, Math.max(used / max, 0.02))
}

export function claimLumoRequest(state: LumoQuotaState, now = new Date()): LumoClaim {
  const normalized = normalizeLumoQuota(state, now)
  if (normalized.dayCount >= LUMO_MAX_RPD) {
    return { ok: false, limit: 'rpd', state: normalized }
  }
  if (normalized.stamps.length >= LUMO_MAX_RPM) {
    return { ok: false, limit: 'rpm', state: normalized }
  }
  return {
    ok: true,
    state: {
      day: normalized.day,
      dayCount: normalized.dayCount + 1,
      stamps: [...normalized.stamps, now.getTime()],
    },
  }
}

export function lumoQuotaBlockMessage(limit: 'rpd' | 'rpm'): string {
  if (limit === 'rpd') {
    const template =
      t('profile.llm.lumoRpdReached') || 'Denní limit Proton Lumo je vyčerpaný (%s/%s). Obnoví se o půlnoci.'
    return template.replace('%s', `${LUMO_MAX_RPD}`).replace('%s', `${LUMO_MAX_RPD}`)
  }
  const template = t('profile.llm.lumoRpmReached') || 'Proton Lumo dovoluje %s požadavků za minutu. Zkuste to za chvíli.'
  return template.replace('%s', `${LUMO_MAX_RPM}`)
}

function publish(snapshot: LumoQuotaSnapshot) {
  listeners.forEach(listener => {
    try {
      listener(snapshot)
    } catch (e) {
      console.warn('Lumo quota listener error', e)
    }
  })
}

function lock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn)
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function loadState(now: Date): Promise<LumoQuotaState> {
  if (!memory) {
    memory = normalizeLumoQuota(await Storage.getLumoQuota(), now)
  } else {
    memory = normalizeLumoQuota(memory, now)
  }
  return memory
}

export function subscribeLumoQuota(listener: (snapshot: LumoQuotaSnapshot) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function readLumoQuota(now = new Date()): Promise<LumoQuotaSnapshot> {
  return lock(async () => lumoQuotaSnapshot(await loadState(now), now))
}

export async function reserveLumoRequest(
  now = new Date(),
): Promise<{ snapshot: LumoQuotaSnapshot; blocked: 'rpd' | 'rpm' | null }> {
  return lock(async () => {
    const claim = claimLumoRequest(await loadState(now), now)
    memory = claim.state
    await Storage.setLumoQuota(memory)
    const snapshot = lumoQuotaSnapshot(memory, now)
    publish(snapshot)
    return { snapshot, blocked: claim.ok ? null : claim.limit }
  })
}

export async function assertLumoQuota(now = new Date()): Promise<void> {
  const { blocked } = await reserveLumoRequest(now)
  if (blocked) {
    throw new Error(lumoQuotaBlockMessage(blocked))
  }
}

export function resetLumoQuotaForTests() {
  memory = null
  chain = Promise.resolve()
  listeners.clear()
}
