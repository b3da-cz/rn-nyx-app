jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import { Storage } from '../src/lib/Storage'
import {
  canonicalLumoModelId,
  canonicalLumoModelName,
  claimLumoRequest,
  emptyLumoQuota,
  getLumoModelsQuotaSnapshot,
  isProtonModel,
  LUMO_MAX_RPD,
  LUMO_MAX_RPM,
  lumoMaxRpdForModel,
  lumoQuotaBarRatio,
  lumoQuotaPercentLabel,
  lumoQuotaSnapshot,
  normalizeLumoQuota,
  readLumoQuota,
  reserveLumoRequest,
  resetLumoQuotaForTests,
} from '../src/lib/lumo'

describe('Proton Lumo quota', () => {
  const at = (day: number, hours: number, minutes = 0, seconds = 0) => new Date(2026, 9, day, hours, minutes, seconds)

  beforeEach(async () => {
    resetLumoQuotaForTests()
    await Storage.setLumoQuota(null)
  })

  it('resets the daily counter at local midnight and keeps the sliding minute', () => {
    const evening = at(28, 23, 59, 30)
    const first = claimLumoRequest(emptyLumoQuota(evening), evening)
    expect(first.ok).toBe(true)
    if (!first.ok) {
      return
    }
    const morning = at(29, 0, 0, 10)
    expect(lumoQuotaSnapshot(first.state, morning)).toEqual({
      rpdUsed: 0,
      rpmUsed: 1,
      rpdMax: LUMO_MAX_RPD,
      rpmMax: LUMO_MAX_RPM,
    })
    const later = at(29, 0, 1, 31)
    expect(lumoQuotaSnapshot(first.state, later).rpmUsed).toBe(0)
  })

  it('stops at 20 requests in the same minute and does not count the blocked one', () => {
    const now = at(28, 12, 0, 0)
    let state = emptyLumoQuota(now)
    for (let i = 0; i < LUMO_MAX_RPM; i += 1) {
      const claim = claimLumoRequest(state, now)
      expect(claim.ok).toBe(true)
      if (claim.ok) {
        state = claim.state
      }
    }
    const blocked = claimLumoRequest(state, now)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.limit).toBe('rpm')
    }
    expect(lumoQuotaSnapshot(blocked.state, now).rpmUsed).toBe(LUMO_MAX_RPM)
    expect(lumoQuotaSnapshot(blocked.state, now).rpdUsed).toBe(LUMO_MAX_RPM)
  })

  it('stops at 250 requests for the local day on lumo-lite', () => {
    const now = at(28, 8, 0, 0)
    const full = normalizeLumoQuota({ day: '2026-10-28', dayCount: LUMO_MAX_RPD, stamps: [] }, now)
    const blocked = claimLumoRequest(full, now)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.limit).toBe('rpd')
    }
    expect(blocked.state.dayCount).toBe(LUMO_MAX_RPD)
  })

  it('labels a small share as under one percent', () => {
    expect(lumoQuotaPercentLabel(1, 500)).toBe('<1%')
    expect(lumoQuotaPercentLabel(0, 500)).toBe('0%')
    expect(lumoQuotaPercentLabel(250, 500)).toBe('50%')
    expect(lumoQuotaPercentLabel(10, 20)).toBe('50%')
  })

  it('stores a reserved request and reads it back', async () => {
    const now = at(28, 15, 0, 0)
    const first = await reserveLumoRequest(now)
    expect(first.blocked).toBeNull()
    expect(first.snapshot.rpdUsed).toBe(1)
    resetLumoQuotaForTests()
    expect(await readLumoQuota(now)).toEqual({
      rpdUsed: 1,
      rpmUsed: 1,
      rpdMax: LUMO_MAX_RPD,
      rpmMax: LUMO_MAX_RPM,
    })
  })

  it('computes bar ratio with minimum notch above zero', () => {
    expect(lumoQuotaBarRatio(0, 500)).toBe(0)
    expect(lumoQuotaBarRatio(1, 500)).toBe(0.02)
    expect(lumoQuotaBarRatio(250, 500)).toBe(0.5)
    expect(lumoQuotaBarRatio(500, 500)).toBe(1)
    expect(lumoQuotaBarRatio(600, 500)).toBe(1)
  })

  it('tracks quotas separately per model with individual limits', async () => {
    const now = at(28, 10, 0, 0)

    expect(lumoMaxRpdForModel('lumo-lite')).toBe(250)
    expect(lumoMaxRpdForModel('lumo-max')).toBe(50)
    expect(lumoMaxRpdForModel('apertus-15')).toBe(500)

    // Reserve 1 request on lumo-max
    const maxRes = await reserveLumoRequest('lumo-max', now)
    expect(maxRes.blocked).toBeNull()
    expect(maxRes.snapshot.rpdUsed).toBe(1)
    expect(maxRes.snapshot.rpdMax).toBe(50)

    // Verify lumo-lite is still at 0
    const liteSnap = await readLumoQuota('lumo-lite', now)
    expect(liteSnap.rpdUsed).toBe(0)
    expect(liteSnap.rpdMax).toBe(250)

    // Reserve 1 request on apertus-15
    const apRes = await reserveLumoRequest('apertus-15', now)
    expect(apRes.blocked).toBeNull()
    expect(apRes.snapshot.rpdUsed).toBe(1)
    expect(apRes.snapshot.rpdMax).toBe(500)

    // Check getLumoModelsQuotaSnapshot
    const snapshotMap = await getLumoModelsQuotaSnapshot(now)
    expect(snapshotMap['lumo-lite']).toEqual({ used: 0, max: 250 })
    expect(snapshotMap['lumo-max']).toEqual({ used: 1, max: 50 })
    expect(snapshotMap['apertus-15']).toEqual({ used: 1, max: 500 })
  })

  it('stops lumo-max at 50 requests without blocking other models', () => {
    const now = at(28, 10, 0, 0)
    let state = emptyLumoQuota(now)

    // Fill lumo-max to 50 across different minutes
    for (let i = 0; i < 50; i += 1) {
      const stepTime = at(28, 10 + Math.floor(i / 10), (i % 10) * 5, 0)
      const claim = claimLumoRequest(state, 'lumo-max', stepTime)
      expect(claim.ok).toBe(true)
      if (claim.ok) {
        state = claim.state
      }
    }

    const finalTime = at(28, 16, 0, 0)
    // 51st on lumo-max should be blocked by rpd
    const blockedMax = claimLumoRequest(state, 'lumo-max', finalTime)
    expect(blockedMax.ok).toBe(false)
    if (!blockedMax.ok) {
      expect(blockedMax.limit).toBe('rpd')
    }

    // But lumo-lite can still make requests
    const liteClaim = claimLumoRequest(state, 'lumo-lite', finalTime)
    expect(liteClaim.ok).toBe(true)

    // And apertus-15 can still make requests
    const apertusClaim = claimLumoRequest(state, 'apertus-15', finalTime)
    expect(apertusClaim.ok).toBe(true)
  })

  it('canonicalizes model IDs and names properly', () => {
    expect(canonicalLumoModelId('lumo')).toBe('lumo-lite')
    expect(canonicalLumoModelId('')).toBe('lumo-lite')
    expect(canonicalLumoModelId(undefined)).toBe('lumo-lite')
    expect(canonicalLumoModelId('lumo-max')).toBe('lumo-max')
    expect(canonicalLumoModelId('apertus-15')).toBe('apertus-15')
    expect(canonicalLumoModelId('unknown-model')).toBe('lumo-lite')

    expect(canonicalLumoModelName('lumo')).toBe('Lumo Lite')
    expect(canonicalLumoModelName('lumo-max')).toBe('Lumo Max')
    expect(canonicalLumoModelName('apertus-15')).toBe('Apertus 15')
  })

  it('migrates legacy quota format with top-level dayCount to lumo-lite', () => {
    const now = at(28, 12, 0, 0)
    const legacy = { day: '2026-10-28', dayCount: 42, stamps: [now.getTime()] }
    const normalized = normalizeLumoQuota(legacy, now)

    expect(normalized.models['lumo-lite'].dayCount).toBe(42)
    expect(normalized.models['lumo-max'].dayCount).toBe(0)
    expect(normalized.models['apertus-15'].dayCount).toBe(0)
  })

  it('identifies Proton models correctly with isProtonModel', () => {
    expect(isProtonModel('lumo-lite')).toBe(true)
    expect(isProtonModel('lumo-max')).toBe(true)
    expect(isProtonModel('apertus-15')).toBe(true)
    expect(isProtonModel('lumo')).toBe(true)
    expect(isProtonModel('google/gemini-2.5-flash')).toBe(false)
    expect(isProtonModel('openai/gpt-4o-mini')).toBe(false)
    expect(isProtonModel('')).toBe(false)
    expect(isProtonModel(null)).toBe(false)
  })

  it('isolates cached models between openrouter, openai, and lumo', async () => {
    await Storage.setCachedLlmModels([{ id: 'or-1', name: 'OR 1' }], 'openrouter')
    await Storage.setCachedLlmModels([{ id: 'lumo-lite', name: 'Lumo Lite' }], 'lumo')
    await Storage.setCachedLlmModels([{ id: 'oai-1', name: 'OAI 1' }], 'openai')

    const lumoModels = await Storage.getCachedLlmModels('lumo')
    expect(lumoModels).toEqual([{ id: 'lumo-lite', name: 'Lumo Lite' }])

    const orModels = await Storage.getCachedLlmModels('openrouter')
    expect(orModels).toEqual([{ id: 'or-1', name: 'OR 1' }])

    const oaiModels = await Storage.getCachedLlmModels('openai')
    expect(oaiModels).toEqual([{ id: 'oai-1', name: 'OAI 1' }])
  })
})
