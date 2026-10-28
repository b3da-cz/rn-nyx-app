jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import { Storage } from '../src/lib/Storage'
import {
  claimLumoRequest,
  emptyLumoQuota,
  LUMO_MAX_RPD,
  LUMO_MAX_RPM,
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

  it('stops at 500 requests for the local day', () => {
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
})
