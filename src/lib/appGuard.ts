import { NativeModules } from 'react-native'

type AppGuardNative = {
  hasFingerprint?: () => Promise<boolean>
  authenticate?: (title: string, cancel: string) => Promise<boolean>
  setSecure?: (enabled: boolean) => void
}

const native: AppGuardNative | undefined = NativeModules.AppGuard

export async function hasFingerprintSensor(): Promise<boolean> {
  if (!native?.hasFingerprint) {
    return false
  }
  try {
    return !!(await native.hasFingerprint())
  } catch (e) {
    return false
  }
}

export async function authenticateFingerprint(title: string, cancel: string): Promise<boolean> {
  if (!native?.authenticate) {
    return false
  }
  try {
    return !!(await native.authenticate(title, cancel))
  } catch (e) {
    return false
  }
}

export function setAppSecure(enabled: boolean) {
  try {
    native?.setSecure?.(!!enabled)
  } catch (e) {
    console.warn(e)
  }
}
