import {
  FOURTEEN_DAYS_MS,
  SEVEN_DAYS_MS,
  SIX_WEEKS_MS,
  shouldShowPrompt,
  type RatingPromptState,
} from '../src/lib/ratingPrompt'

describe('ratingPrompt logic', () => {
  const currentVersion = 75
  const baseTime = 1700000000000

  describe('fresh install', () => {
    const freshState: RatingPromptState = {
      installedAt: baseTime,
      isFreshInstall: true,
    }

    it('does not show on day 0', () => {
      expect(shouldShowPrompt(freshState, currentVersion, baseTime)).toBe(false)
    })

    it('does not show on day 3 or 6', () => {
      const day3 = baseTime + 3 * 24 * 60 * 60 * 1000
      const day6 = baseTime + 6 * 24 * 60 * 60 * 1000
      expect(shouldShowPrompt(freshState, currentVersion, day3)).toBe(false)
      expect(shouldShowPrompt(freshState, currentVersion, day6)).toBe(false)
    })

    it('shows after 7 days', () => {
      const day7 = baseTime + SEVEN_DAYS_MS
      expect(shouldShowPrompt(freshState, currentVersion, day7)).toBe(true)
    })
  })

  describe('existing user update', () => {
    const existingUserState: RatingPromptState = {
      installedAt: baseTime,
      isFreshInstall: false,
    }

    it('shows immediately on update', () => {
      expect(shouldShowPrompt(existingUserState, currentVersion, baseTime)).toBe(true)
    })
  })

  describe('after user tapped Google Play (gplay)', () => {
    const gplayState: RatingPromptState = {
      installedAt: baseTime - SEVEN_DAYS_MS,
      isFreshInstall: false,
      lastAction: 'gplay',
      lastPromptedAt: baseTime,
      lastPromptedVersion: currentVersion,
    }

    it('does not show before 6 weeks', () => {
      const fiveWeeks = baseTime + 5 * 7 * 24 * 60 * 60 * 1000
      expect(shouldShowPrompt(gplayState, currentVersion, fiveWeeks)).toBe(false)
    })

    it('shows again after 6 weeks', () => {
      const sixWeeks = baseTime + SIX_WEEKS_MS
      expect(shouldShowPrompt(gplayState, currentVersion, sixWeeks)).toBe(true)
    })
  })

  describe('after user tapped later', () => {
    const laterState: RatingPromptState = {
      installedAt: baseTime - SEVEN_DAYS_MS,
      isFreshInstall: false,
      lastAction: 'later',
      lastPromptedAt: baseTime,
      lastPromptedVersion: currentVersion,
    }

    it('does not show before 14 days on same version', () => {
      const day10 = baseTime + 10 * 24 * 60 * 60 * 1000
      expect(shouldShowPrompt(laterState, currentVersion, day10)).toBe(false)
    })

    it('shows after 14 days on same version', () => {
      const day14 = baseTime + FOURTEEN_DAYS_MS
      expect(shouldShowPrompt(laterState, currentVersion, day14)).toBe(true)
    })

    it('shows immediately if app updated to new version even after 1 day', () => {
      const day1 = baseTime + 1 * 24 * 60 * 60 * 1000
      const newVersion = currentVersion + 1
      expect(shouldShowPrompt(laterState, newVersion, day1)).toBe(true)
    })
  })
})
