import { setAppSecure } from './appGuard'

// Screenshot lock is the settings cover OR any protected summary currently on screen.
// Releasing the last summary restores whatever Settings last stored.

let settingsCover = false
let holds = 0
let secure = false
const layoutListeners = new Set<() => void>()

function apply() {
  const next = settingsCover || holds > 0
  secure = next
  setAppSecure(next)
}

export function setSettingsCover(enabled: boolean) {
  settingsCover = !!enabled
  apply()
}

export function acquireScreenSecure(): () => void {
  holds += 1
  apply()
  let released = false
  return () => {
    if (released) {
      return
    }
    released = true
    holds = Math.max(0, holds - 1)
    apply()
  }
}

export function subscribeSecureLayout(listener: () => void): () => void {
  layoutListeners.add(listener)
  return () => {
    layoutListeners.delete(listener)
  }
}

export function notifySecureLayout() {
  layoutListeners.forEach(listener => listener())
}

export function screenSecureSnapshot() {
  return { settingsCover, holds, secure }
}

export function resetScreenSecureForTests() {
  settingsCover = false
  holds = 0
  secure = false
  layoutListeners.clear()
}
