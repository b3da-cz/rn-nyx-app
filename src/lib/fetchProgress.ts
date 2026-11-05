export type FetchProgressMode = 'off' | 'overall' | 'detailed'
export type FetchProgressGlobal = 'off' | 'detailed'
export type FetchProgressWhere = 'enter' | 'more' | 'lists'

export const FETCH_PROGRESS_ENTER_DEFAULT: FetchProgressMode = 'overall'
export const FETCH_PROGRESS_MORE_DEFAULT: FetchProgressMode = 'overall'
export const FETCH_PROGRESS_LISTS_DEFAULT: FetchProgressMode = 'overall'
export const FETCH_PROGRESS_GLOBAL_DEFAULT: FetchProgressGlobal = 'detailed'

export const normalizeFetchProgressMode = (
  value: unknown,
  fallback: FetchProgressMode,
): FetchProgressMode => (value === 'off' || value === 'overall' || value === 'detailed' ? value : fallback)

export const normalizeFetchProgressGlobal = (
  value: unknown,
  fallback: FetchProgressGlobal = FETCH_PROGRESS_GLOBAL_DEFAULT,
): FetchProgressGlobal => (value === 'off' || value === 'detailed' ? value : fallback)

export const resolveFetchProgressGlobal = (config?: {
  isFetchProgressEnabled?: boolean
  fetchProgress?: unknown
} | null): FetchProgressGlobal => {
  if (config?.fetchProgress === 'off' || config?.fetchProgress === 'detailed') {
    return config.fetchProgress
  }
  if (config?.isFetchProgressEnabled === false) {
    return 'off'
  }
  return FETCH_PROGRESS_GLOBAL_DEFAULT
}

export const resolveFetchProgressMode = (
  config?: {
    isFetchProgressEnabled?: boolean
    fetchProgress?: unknown
    fetchProgressEnter?: unknown
    fetchProgressMore?: unknown
    fetchProgressLists?: unknown
  } | null,
  where: FetchProgressWhere = 'enter',
): FetchProgressMode => {
  if (resolveFetchProgressGlobal(config) === 'off') {
    return 'off'
  }
  const fallback =
    where === 'more'
      ? FETCH_PROGRESS_MORE_DEFAULT
      : where === 'lists'
        ? FETCH_PROGRESS_LISTS_DEFAULT
        : FETCH_PROGRESS_ENTER_DEFAULT
  const raw =
    where === 'more'
      ? config?.fetchProgressMore
      : where === 'lists'
        ? config?.fetchProgressLists
        : config?.fetchProgressEnter
  return normalizeFetchProgressMode(raw, fallback)
}

export type FetchProgressEvent = {
  id: string
  label?: string
  detail?: string
  done: number
  total: number
  networkBytes?: number
}

export type FetchProgressStep = {
  id: string
  label: string
  detail?: string
  done: number
  total: number
  networkBytes?: number
}

export type FetchProgressState = {
  steps: FetchProgressStep[]
  networkBytes?: number
}

export const emptyFetchProgress = (): FetchProgressState => ({ steps: [], networkBytes: 0 })

export const reduceFetchProgress = (
  state: FetchProgressState | undefined,
  event: FetchProgressEvent,
): FetchProgressState => {
  const steps = (state?.steps || []).slice()
  const index = steps.findIndex(step => step.id === event.id)
  const prev = index >= 0 ? steps[index] : undefined
  const next: FetchProgressStep = {
    id: event.id,
    label: event.label || prev?.label || '',
    detail: event.detail !== undefined ? event.detail : prev?.detail,
    done: event.done,
    total: event.total,
    networkBytes: event.networkBytes !== undefined ? event.networkBytes : prev?.networkBytes,
  }
  if (index < 0) {
    steps.push(next)
  } else {
    steps[index] = next
  }
  let totalBytes = 0
  for (const step of steps) {
    if (step.networkBytes && step.networkBytes > 0) {
      totalBytes += step.networkBytes
    }
  }
  return { steps, networkBytes: totalBytes }
}

export const formatNetworkBytes = (bytes?: number | null): string | null => {
  if (bytes == null || bytes <= 0) {
    return null
  }
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${Math.max(1, Math.round(kb))} kB`
  }
  const mb = kb / 1024
  return `${mb.toFixed(3)} MB`
}

export const fetchProgressRatio = (state?: FetchProgressState | null) => {
  let done = 0
  let total = 0
  for (const step of state?.steps || []) {
    if (!(step.total > 0)) {
      continue
    }
    total += step.total
    done += Math.min(Math.max(step.done, 0), step.total)
  }
  return { done, total, ratio: total > 0 ? done / total : 0, networkBytes: state?.networkBytes || 0 }
}

export const shortenFetchDetail = (value?: string) => {
  if (!value) {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  let text = trimmed
  try {
    const url = new URL(trimmed)
    const name = url.pathname.split('/').filter(Boolean).pop()
    text = name ? `${url.hostname}/${name}` : url.hostname
  } catch (e) {
    text = trimmed
  }
  return text.length > 64 ? `${text.slice(0, 61)}…` : text
}

export const settleWithin = <T>(work: Promise<T>, ms: number, fallback: T): Promise<T> => {
  return new Promise(resolve => {
    let settled = false
    const finish = (value: T) => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      resolve(value)
    }
    const timer = setTimeout(() => finish(fallback), ms)
    work.then(
      value => finish(value),
      () => finish(fallback),
    )
  })
}
