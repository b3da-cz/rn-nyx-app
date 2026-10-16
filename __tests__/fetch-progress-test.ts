import {
  emptyFetchProgress,
  fetchProgressRatio,
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
    expect(fetchProgressRatio(updated)).toEqual({ done: 1, total: 4, ratio: 0.25 })
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

  it('defaults to detailed on open and overall while loading more', () => {
    expect(resolveFetchProgressMode(undefined, 'enter')).toBe('detailed')
    expect(resolveFetchProgressMode({}, 'more')).toBe('overall')
    expect(resolveFetchProgressMode({ isFetchProgressEnabled: false, fetchProgressEnter: 'detailed' }, 'enter')).toBe(
      'off',
    )
    expect(resolveFetchProgressMode({ fetchProgressEnter: 'off', fetchProgressMore: 'detailed' }, 'enter')).toBe('off')
    expect(resolveFetchProgressMode({ fetchProgressMore: 'detailed' }, 'more')).toBe('detailed')
    expect(resolveFetchProgressMode({ fetchProgressEnter: 'nope' }, 'enter')).toBe('detailed')
  })

  it('settles with the fallback when the work never finishes', async () => {
    const pending = settleWithin(new Promise(() => undefined), 20, 'gave-up')
    await expect(pending).resolves.toBe('gave-up')
  })
})
