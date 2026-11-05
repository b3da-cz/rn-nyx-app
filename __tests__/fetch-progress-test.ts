import {
  emptyFetchProgress,
  fetchProgressRatio,
  formatNetworkBytes,
  reduceFetchProgress,
  resolveFetchProgressMode,
  settleWithin,
  shortenFetchDetail,
} from '../src/lib/fetchProgress'

describe('fetch progress', () => {
  it('appends steps in order and updates a step in place', () => {
    const started = reduceFetchProgress(emptyFetchProgress(), { id: 'request', label: 'Klub', done: 0, total: 1 })
    const withSizes = reduceFetchProgress(started, { id: 'sizes', done: 0, total: 3, detail: 'https://nyx.cz/a.jpg' })
    const updated = reduceFetchProgress(withSizes, { id: 'sizes', done: 1, total: 3, detail: 'https://nyx.cz/b.jpg' })
    expect(updated.steps.map(step => step.id)).toEqual(['request', 'sizes'])
    expect(updated.steps[0].label).toBe('Klub')
    expect(updated.steps[1].done).toBe(1)
    expect(updated.steps[1].detail).toBe('https://nyx.cz/b.jpg')
    expect(fetchProgressRatio(updated)).toEqual({ done: 1, total: 4, ratio: 0.25, networkBytes: 0 })
  })

  it('formats network bytes in kB and MB with 3 decimals over 1024 kB', () => {
    expect(formatNetworkBytes(null)).toBeNull()
    expect(formatNetworkBytes(0)).toBeNull()
    expect(formatNetworkBytes(-5)).toBeNull()
    expect(formatNetworkBytes(512)).toBe('1 kB')
    expect(formatNetworkBytes(50 * 1024)).toBe('50 kB')
    expect(formatNetworkBytes(1024 * 1024 - 1)).toBe('1024 kB')
    expect(formatNetworkBytes(1024 * 1024)).toBe('1.000 MB')
    expect(formatNetworkBytes(1.5 * 1024 * 1024)).toBe('1.500 MB')
    expect(formatNetworkBytes(2534567)).toBe('2.417 MB')
  })

  it('accumulates networkBytes across steps', () => {
    const s1 = reduceFetchProgress(emptyFetchProgress(), { id: 'request', done: 1, total: 1, networkBytes: 50000 })
    const s2 = reduceFetchProgress(s1, { id: 'sizes', done: 1, total: 2, networkBytes: 200000 })
    expect(s2.networkBytes).toBe(250000)
    expect(fetchProgressRatio(s2).networkBytes).toBe(250000)
  })

  it('keeps the previous file name when a later tick omits it', () => {
    const started = reduceFetchProgress(emptyFetchProgress(), {
      id: 'bytes',
      done: 0,
      total: 2,
      detail: 'https://nyx.cz/files/one.jpg',
    })
    const next = reduceFetchProgress(started, { id: 'bytes', done: 1, total: 2 })
    expect(next.steps[0].detail).toBe('https://nyx.cz/files/one.jpg')
  })

  it('shortens a file url to host and name', () => {
    expect(shortenFetchDetail('https://nyx.cz/files/abc/original.jpg')).toBe('nyx.cz/original.jpg')
    expect(shortenFetchDetail('not a url')).toBe('not a url')
    expect(shortenFetchDetail('')).toBeUndefined()
  })

  it('defaults to overall everywhere on a fresh install', () => {
    expect(resolveFetchProgressMode(undefined, 'enter')).toBe('overall')
    expect(resolveFetchProgressMode({}, 'more')).toBe('overall')
    expect(resolveFetchProgressMode({}, 'lists')).toBe('overall')
    expect(resolveFetchProgressMode({ isFetchProgressEnabled: false, fetchProgressEnter: 'detailed' }, 'enter')).toBe(
      'off',
    )
    expect(resolveFetchProgressMode({ fetchProgress: 'off', fetchProgressEnter: 'detailed' }, 'enter')).toBe('off')
    expect(resolveFetchProgressMode({ fetchProgress: 'detailed', isFetchProgressEnabled: false }, 'lists')).toBe(
      'overall',
    )
    expect(resolveFetchProgressMode({ fetchProgressEnter: 'off', fetchProgressMore: 'detailed' }, 'enter')).toBe('off')
    expect(resolveFetchProgressMode({ fetchProgressMore: 'detailed' }, 'more')).toBe('detailed')
    expect(resolveFetchProgressMode({ fetchProgressLists: 'overall' }, 'lists')).toBe('overall')
    expect(resolveFetchProgressMode({ fetchProgressEnter: 'nope' }, 'enter')).toBe('overall')
  })

  it('settles with the fallback when the work never finishes', async () => {
    const pending = settleWithin(new Promise(() => undefined), 20, 'gave-up')
    await expect(pending).resolves.toBe('gave-up')
  })
})
