import { Storage } from './Storage'

export type RatingAction = 'gplay' | 'later'

export type RatingPromptState = {
  installedAt: number
  isFreshInstall: boolean
  lastPromptedAt?: number
  lastPromptedVersion?: number
  lastAction?: RatingAction
}

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
export const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
export const SIX_WEEKS_MS = 42 * 24 * 60 * 60 * 1000

export const shouldShowPrompt = (
  state: RatingPromptState | null,
  currentVersion: number,
  now: number = Date.now(),
): boolean => {
  if (!state) {
    return false
  }
  if (!state.lastPromptedAt) {
    if (state.isFreshInstall) {
      return now - state.installedAt >= SEVEN_DAYS_MS
    }
    return true
  }
  if (state.lastAction === 'gplay') {
    return now - state.lastPromptedAt >= SIX_WEEKS_MS
  }
  if (state.lastAction === 'later') {
    const isNewVersion = currentVersion > (state.lastPromptedVersion || 0)
    const isFourteenDaysPassed = now - state.lastPromptedAt >= FOURTEEN_DAYS_MS
    return isNewVersion || isFourteenDaysPassed
  }
  return false
}

export const checkAndRecordAppStart = async (
  currentVersion: number,
  hasExistingAuth: boolean,
  now: number = Date.now(),
): Promise<boolean> => {
  let state: RatingPromptState | null = await Storage.getRatingPrompt()
  if (!state) {
    state = {
      installedAt: now,
      isFreshInstall: !hasExistingAuth,
    }
    await Storage.setRatingPrompt(state)
  }
  return shouldShowPrompt(state, currentVersion, now)
}

export const recordRatingPromptAction = async (
  action: RatingAction,
  currentVersion: number,
  now: number = Date.now(),
): Promise<void> => {
  const state: RatingPromptState = (await Storage.getRatingPrompt()) || {
    installedAt: now,
    isFreshInstall: false,
  }
  state.lastAction = action
  state.lastPromptedAt = now
  state.lastPromptedVersion = currentVersion
  await Storage.setRatingPrompt(state)
}
