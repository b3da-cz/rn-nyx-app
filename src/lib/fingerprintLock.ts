export const FINGERPRINT_LOCK_MINUTES = [0, 1, 2, 3, 5, 10, 20, 30] as const

export function normalizeFingerprintLockMinutes(value: unknown): number {
  const minutes = typeof value === 'number' ? value : Number(value)
  return (FINGERPRINT_LOCK_MINUTES as readonly number[]).includes(minutes) ? minutes : 0
}

// backgroundAt is the last time the app left the foreground.
// Missing timestamp means a cold start, which always locks.
// 0 minutes means immediately on the next return.
export function shouldRequireFingerprint(input: {
  enabled: boolean
  minutes: number
  now: number
  backgroundAt: number | null
}): boolean {
  if (!input.enabled) {
    return false
  }
  if (input.backgroundAt == null || !Number.isFinite(input.backgroundAt)) {
    return true
  }
  const minutes = normalizeFingerprintLockMinutes(input.minutes)
  if (minutes <= 0) {
    return true
  }
  return input.now - input.backgroundAt >= minutes * 60 * 1000
}
