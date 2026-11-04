import { useEffect, useState } from 'react'
import {
  canonicalLumoModelId,
  emptyLumoQuota,
  LUMO_DEFAULT_MODEL_ID,
  lumoQuotaSnapshot,
  LumoQuotaSnapshot,
  readLumoQuota,
  subscribeLumoQuota,
} from '../../lib'

const initialSnapshot = (modelId: string): LumoQuotaSnapshot =>
  lumoQuotaSnapshot(emptyLumoQuota(), modelId)

export function useLumoQuota(enabled = true, modelId = LUMO_DEFAULT_MODEL_ID): LumoQuotaSnapshot {
  const canonicalId = canonicalLumoModelId(modelId)
  const [snapshot, setSnapshot] = useState<LumoQuotaSnapshot>(() => initialSnapshot(canonicalId))

  useEffect(() => {
    if (!enabled) {
      return
    }
    let alive = true
    const pull = () => {
      readLumoQuota(canonicalId)
        .then(next => {
          if (alive) {
            setSnapshot(next)
          }
        })
        .catch(() => undefined)
    }
    pull()
    const unsubscribe = subscribeLumoQuota(() => {
      if (alive) {
        pull()
      }
    })
    const timer = setInterval(pull, 1000)
    return () => {
      alive = false
      unsubscribe()
      clearInterval(timer)
    }
  }, [enabled, canonicalId])

  return snapshot
}
