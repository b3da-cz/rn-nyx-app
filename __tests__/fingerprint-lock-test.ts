import { normalizeFingerprintLockMinutes, shouldRequireFingerprint } from '../src/lib/fingerprintLock'

describe('fingerprint lock grace', () => {
  const now = 1_000_000

  it('stays off when the lock is disabled', () => {
    expect(shouldRequireFingerprint({ enabled: false, minutes: 0, now, backgroundAt: null })).toBe(false)
  })

  it('locks a cold start', () => {
    expect(shouldRequireFingerprint({ enabled: true, minutes: 5, now, backgroundAt: null })).toBe(true)
  })

  it('locks immediately after any leave', () => {
    expect(shouldRequireFingerprint({ enabled: true, minutes: 0, now, backgroundAt: now - 1 })).toBe(true)
  })

  it('keeps the session inside the selected window', () => {
    expect(shouldRequireFingerprint({ enabled: true, minutes: 5, now, backgroundAt: now - 4 * 60 * 1000 })).toBe(false)
    expect(shouldRequireFingerprint({ enabled: true, minutes: 5, now, backgroundAt: now - 5 * 60 * 1000 })).toBe(true)
  })

  it('falls back to immediately for an unknown delay', () => {
    expect(normalizeFingerprintLockMinutes('nope')).toBe(0)
    expect(normalizeFingerprintLockMinutes(4)).toBe(0)
    expect(normalizeFingerprintLockMinutes(10)).toBe(10)
  })
})
