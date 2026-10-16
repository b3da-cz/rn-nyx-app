export type FetchProgressMode = 'off' | 'overall' | 'detailed'
export type FetchProgressWhere = 'enter' | 'more'

export const FETCH_PROGRESS_ENTER_DEFAULT: FetchProgressMode = 'detailed'
export const FETCH_PROGRESS_MORE_DEFAULT: FetchProgressMode = 'overall'

export const normalizeFetchProgressMode = (
  value: unknown,
  fallback: FetchProgressMode,
): FetchProgressMode => (value === 'off' || value === 'overall' || value === 'detailed' ? value : fallback)

export const resolveFetchProgressMode = (
  config?: {
    isFetchProgressEnabled?: boolean
    fetchProgressEnter?: unknown
    fetchProgressMore?: unknown
  } | null,
  where: FetchProgressWhere = 'enter',
): FetchProgressMode => {
  if (config?.isFetchProgressEnabled === false) {
    return 'off'
  }
  const fallback = where === 'more' ? FETCH_PROGRESS_MORE_DEFAULT : FETCH_PROGRESS_ENTER_DEFAULT
  const raw = where === 'more' ? config?.fetchProgressMore : config?.fetchProgressEnter
  return normalizeFetchProgressMode(raw, fallback)
}

export type FetchProgressEvent = {
  id: string
  label?: string
  detail?: string
  done: number
  total: number
}

export type FetchProgressStep = {
  id: string
  label: string
  detail?: string
  done: number
  total: number
}

export type FetchProgressState = {
  steps: FetchProgressStep[]
}

export const emptyFetchProgress = (): FetchProgressState => ({ steps: [] })

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
  }
  if (index < 0) {
    steps.push(next)
  } else {
    steps[index] = next
  }
  return { steps }
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
  return { done, total, ratio: total > 0 ? done / total : 0 }
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
