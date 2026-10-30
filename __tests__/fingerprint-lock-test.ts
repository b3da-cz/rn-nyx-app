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

  it('locks every time when returning from background with 0 minutes', () => {
    // Consecutive trips to background (e.g. clicking external link to browser multiple times)
    const trip1Leave = 1_000_000
    const trip1Return = 1_000_500
    expect(shouldRequireFingerprint({ enabled: true, minutes: 0, now: trip1Return, backgroundAt: trip1Leave })).toBe(true)

    // After unlock, backgroundAt is cleared (null). While active in app, no background transition occurred.
    // When next leave happens:
    const trip2Leave = 1_002_000
    const trip2Return = 1_002_100
    expect(shouldRequireFingerprint({ enabled: true, minutes: 0, now: trip2Return, backgroundAt: trip2Leave })).toBe(true)

    // Even if return is instantaneous (diff 0ms)
    expect(shouldRequireFingerprint({ enabled: true, minutes: 0, now: trip2Leave, backgroundAt: trip2Leave })).toBe(true)
  })
})
