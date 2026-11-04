import { Storage } from './Storage'
import { t } from './Strings'

export const LUMO_BASE_URL = 'https://lumo-api.proton.me/ai/v1'
export const LUMO_DEFAULT_MODEL_ID = 'lumo-lite'
export const LUMO_DEFAULT_MODEL_NAME = 'Lumo Lite'
export const LUMO_MODEL_ID = 'lumo-lite'
export const LUMO_MODEL_NAME = 'Lumo'
export const LUMO_CONTEXT_TOKENS = 131_072

export const LUMO_MODEL_LIMITS: Record<string, number> = {
  'lumo-lite': 250,
  'lumo-max': 50,
  'apertus-15': 500,
  lumo: 250,
}

export const LUMO_MAX_RPD = 250
export const LUMO_MAX_RPM = 20
export const LUMO_RPM_WINDOW_MS = 60_000

export type LumoModelInfo = {
  id: string
  name: string
  description?: string
  context_length: number
  maxRpd: number
}

export const LUMO_MODELS: LumoModelInfo[] = [
  {
    id: 'lumo-lite',
    name: 'Lumo Lite',
    description: 'Rychlý a úsporný model pro běžné dotazy a shrnutí.',
    context_length: 131_072,
    maxRpd: 250,
  },
  {
    id: 'lumo-max',
    name: 'Lumo Max',
    description: 'Nejvýkonnější model pro komplexní uvažování a delší kontext.',
    context_length: 131_072,
    maxRpd: 50,
  },
  {
    id: 'apertus-15',
    name: 'Apertus 15',
    description: 'Otevřený vícejazyčný švýcarský model (Swiss AI) s vysokým denním limitem.',
    context_length: 131_072,
    maxRpd: 500,
  },
]

export function isProtonModel(id?: string | null): boolean {
  const trimmed = (id || '').trim().toLowerCase()
  return (
    trimmed === 'lumo-lite' ||
    trimmed === 'lumo-max' ||
    trimmed === 'apertus-15' ||
    trimmed === 'lumo'
  )
}

export function canonicalLumoModelId(id?: string | null): string {
  const trimmed = (id || '').trim()
  if (trimmed === 'lumo-max') {
    return 'lumo-max'
  }
  if (trimmed === 'apertus-15') {
    return 'apertus-15'
  }
  return 'lumo-lite'
}

export function canonicalLumoModelName(id?: string | null): string {
  const canonical = canonicalLumoModelId(id)
  const found = LUMO_MODELS.find(m => m.id === canonical)
  return found ? found.name : 'Lumo Lite'
}

export function lumoMaxRpdForModel(id?: string | null): number {
  const canonical = canonicalLumoModelId(id)
  return LUMO_MODEL_LIMITS[canonical] ?? 250
}

export type LumoModelQuota = {
  day: string
  dayCount: number
  stamps: number[]
}

export type LumoQuotaState = {
  day: string
  dayCount: number
  stamps: number[]
  models: Record<string, LumoModelQuota>
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

export function resolveModelAndNow(
  modelIdOrNow?: string | Date,
  maybeNow?: Date,
): { modelId: string; now: Date } {
  if (modelIdOrNow instanceof Date) {
    return { modelId: LUMO_DEFAULT_MODEL_ID, now: modelIdOrNow }
  }
  if (typeof modelIdOrNow === 'string') {
    return { modelId: canonicalLumoModelId(modelIdOrNow), now: maybeNow || new Date() }
  }
  return { modelId: LUMO_DEFAULT_MODEL_ID, now: maybeNow || new Date() }
}

function normalizeSingleModelQuota(raw: unknown, day: string, cutoff: number, nowMs: number): LumoModelQuota {
  const source = raw && typeof raw === 'object' ? (raw as Partial<LumoModelQuota>) : null
  const stamps = Array.isArray(source?.stamps)
    ? source.stamps.filter(ts => typeof ts === 'number' && ts > cutoff && ts <= nowMs + 1000)
    : []
  const dayCount =
    source?.day === day && typeof source.dayCount === 'number' && source.dayCount > 0
      ? Math.floor(source.dayCount)
      : 0
  return { day, dayCount, stamps }
}

export function emptyLumoQuota(now = new Date()): LumoQuotaState {
  const day = lumoDayKey(now)
  return {
    day,
    dayCount: 0,
    stamps: [],
    models: {
      'lumo-lite': { day, dayCount: 0, stamps: [] },
      'lumo-max': { day, dayCount: 0, stamps: [] },
      'apertus-15': { day, dayCount: 0, stamps: [] },
    },
  }
}

// The day counter uses the phone's local midnight. RPM is a sliding minute, so it also drops as requests age out.
export function normalizeLumoQuota(raw: unknown, now = new Date()): LumoQuotaState {
  const day = lumoDayKey(now)
  const cutoff = now.getTime() - LUMO_RPM_WINDOW_MS
  const nowMs = now.getTime()
  const source = raw && typeof raw === 'object' ? (raw as any) : null

  const models: Record<string, LumoModelQuota> = {}
  const rawModels = source?.models && typeof source.models === 'object' ? source.models : null

  if (rawModels) {
    for (const key of Object.keys(rawModels)) {
      models[key] = normalizeSingleModelQuota(rawModels[key], day, cutoff, nowMs)
    }
  }

  for (const m of LUMO_MODELS) {
    if (!models[m.id]) {
      models[m.id] = { day, dayCount: 0, stamps: [] }
    }
  }

  // Legacy migration: if top-level dayCount/stamps existed without models
  if (!rawModels && source && (source.dayCount || source.stamps)) {
    models['lumo-lite'] = normalizeSingleModelQuota(source, day, cutoff, nowMs)
  }

  const defaultModel = models[LUMO_DEFAULT_MODEL_ID] || { day, dayCount: 0, stamps: [] }
  return {
    day,
    dayCount: defaultModel.dayCount,
    stamps: defaultModel.stamps,
    models,
  }
}

export function lumoQuotaSnapshot(
  state: LumoQuotaState,
  modelIdOrNow?: string | Date,
  maybeNow?: Date,
): LumoQuotaSnapshot {
  const { modelId, now } = resolveModelAndNow(modelIdOrNow, maybeNow)
  const normalized = normalizeLumoQuota(state, now)
  const modelQuota = normalized.models[modelId] || { day: normalized.day, dayCount: 0, stamps: [] }
  return {
    rpdUsed: modelQuota.dayCount,
    rpmUsed: modelQuota.stamps.length,
    rpdMax: lumoMaxRpdForModel(modelId),
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

export function claimLumoRequest(
  state: LumoQuotaState,
  modelIdOrNow?: string | Date,
  maybeNow?: Date,
): LumoClaim {
  const { modelId, now } = resolveModelAndNow(modelIdOrNow, maybeNow)
  const normalized = normalizeLumoQuota(state, now)
  const current = normalized.models[modelId] || { day: normalized.day, dayCount: 0, stamps: [] }
  const maxRpd = lumoMaxRpdForModel(modelId)

  if (current.dayCount >= maxRpd) {
    return { ok: false, limit: 'rpd', state: normalized }
  }
  if (current.stamps.length >= LUMO_MAX_RPM) {
    return { ok: false, limit: 'rpm', state: normalized }
  }

  const updatedModel: LumoModelQuota = {
    day: current.day,
    dayCount: current.dayCount + 1,
    stamps: [...current.stamps, now.getTime()],
  }
  const nextModels = {
    ...normalized.models,
    [modelId]: updatedModel,
  }
  const defaultModel = nextModels[LUMO_DEFAULT_MODEL_ID] || updatedModel
  return {
    ok: true,
    state: {
      day: normalized.day,
      dayCount: defaultModel.dayCount,
      stamps: defaultModel.stamps,
      models: nextModels,
    },
  }
}

export function lumoQuotaBlockMessage(limit: 'rpd' | 'rpm', modelId?: string): string {
  const maxRpd = lumoMaxRpdForModel(modelId)
  if (limit === 'rpd') {
    const template =
      t('profile.llm.lumoRpdReached') || 'Denní limit Proton Lumo je vyčerpaný (%s/%s). Obnoví se o půlnoci.'
    return template.replace('%s', `${maxRpd}`).replace('%s', `${maxRpd}`)
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

export async function readLumoQuota(
  modelIdOrNow?: string | Date,
  maybeNow?: Date,
): Promise<LumoQuotaSnapshot> {
  const { modelId, now } = resolveModelAndNow(modelIdOrNow, maybeNow)
  return lock(async () => lumoQuotaSnapshot(await loadState(now), modelId, now))
}

export async function reserveLumoRequest(
  modelIdOrNow?: string | Date,
  maybeNow?: Date,
): Promise<{ snapshot: LumoQuotaSnapshot; blocked: 'rpd' | 'rpm' | null }> {
  const { modelId, now } = resolveModelAndNow(modelIdOrNow, maybeNow)
  return lock(async () => {
    const claim = claimLumoRequest(await loadState(now), modelId, now)
    memory = claim.state
    await Storage.setLumoQuota(memory)
    const snapshot = lumoQuotaSnapshot(memory, modelId, now)
    publish(snapshot)
    return { snapshot, blocked: claim.ok ? null : claim.limit }
  })
}

export async function assertLumoQuota(
  modelIdOrNow?: string | Date,
  maybeNow?: Date,
): Promise<void> {
  const { modelId } = resolveModelAndNow(modelIdOrNow, maybeNow)
  const { blocked } = await reserveLumoRequest(modelIdOrNow, maybeNow)
  if (blocked) {
    throw new Error(lumoQuotaBlockMessage(blocked, modelId))
  }
}

export async function getLumoModelsQuotaSnapshot(
  now = new Date(),
): Promise<Record<string, { used: number; max: number }>> {
  return lock(async () => {
    const state = await loadState(now)
    const result: Record<string, { used: number; max: number }> = {}
    for (const m of LUMO_MODELS) {
      const snap = lumoQuotaSnapshot(state, m.id, now)
      result[m.id] = { used: snap.rpdUsed, max: snap.rpdMax }
    }
    return result
  })
}

export function resetLumoQuotaForTests() {
  memory = null
  chain = Promise.resolve()
  listeners.clear()
}
