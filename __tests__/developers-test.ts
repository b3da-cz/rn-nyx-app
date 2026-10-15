import { APP_DEVELOPERS, isAppDeveloper } from '../src/lib/developers'

describe('app developers', () => {
  it('matches the nyx username without regard to case', () => {
    expect(APP_DEVELOPERS).toEqual(['B3DA'])
    expect(isAppDeveloper('B3DA')).toBe(true)
    expect(isAppDeveloper('b3da')).toBe(true)
    expect(isAppDeveloper(' b3da ')).toBe(true)
    expect(isAppDeveloper('someone')).toBe(false)
    expect(isAppDeveloper(undefined)).toBe(false)
    expect(isAppDeveloper('')).toBe(false)
  })
})
