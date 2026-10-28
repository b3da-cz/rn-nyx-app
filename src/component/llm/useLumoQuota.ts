import { useEffect, useState } from 'react'
import { emptyLumoQuota, lumoQuotaSnapshot, LumoQuotaSnapshot, readLumoQuota, subscribeLumoQuota } from '../../lib'

const initialSnapshot = (): LumoQuotaSnapshot => lumoQuotaSnapshot(emptyLumoQuota())

export function useLumoQuota(enabled = true): LumoQuotaSnapshot {
  const [snapshot, setSnapshot] = useState<LumoQuotaSnapshot>(initialSnapshot)

  useEffect(() => {
    if (!enabled) {
      return
    }
    let alive = true
    const pull = () => {
      readLumoQuota()
        .then(next => {
          if (alive) {
            setSnapshot(next)
          }
        })
        .catch(() => undefined)
    }
    pull()
    const unsubscribe = subscribeLumoQuota(next => {
      if (alive) {
        setSnapshot(next)
      }
    })
    const timer = setInterval(pull, 1000)
    return () => {
      alive = false
      unsubscribe()
      clearInterval(timer)
    }
  }, [enabled])

  return snapshot
}
