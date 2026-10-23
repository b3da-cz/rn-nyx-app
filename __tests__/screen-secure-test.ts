import {
  acquireScreenSecure,
  resetScreenSecureForTests,
  screenSecureSnapshot,
  setSettingsCover,
} from '../src/lib/screenSecure'

describe('screen secure holds', () => {
  beforeEach(() => {
    resetScreenSecureForTests()
  })

  it('turns secure on only while a summary hold exists and settings are off', () => {
    setSettingsCover(false)
    expect(screenSecureSnapshot().secure).toBe(false)
    const release = acquireScreenSecure()
    expect(screenSecureSnapshot().secure).toBe(true)
    release()
    expect(screenSecureSnapshot().secure).toBe(false)
  })

  it('keeps the settings cover after the last summary hold ends', () => {
    setSettingsCover(true)
    const release = acquireScreenSecure()
    expect(screenSecureSnapshot().secure).toBe(true)
    release()
    expect(screenSecureSnapshot().secure).toBe(true)
    expect(screenSecureSnapshot().holds).toBe(0)
  })

  it('does not drop a visible summary when the settings cover is off', () => {
    const release = acquireScreenSecure()
    setSettingsCover(false)
    expect(screenSecureSnapshot().secure).toBe(true)
    release()
    expect(screenSecureSnapshot().secure).toBe(false)
  })

  it('keeps secure until every overlapping summary is gone', () => {
    const first = acquireScreenSecure()
    const second = acquireScreenSecure()
    first()
    expect(screenSecureSnapshot().secure).toBe(true)
    second()
    expect(screenSecureSnapshot().secure).toBe(false)
  })

  it('ignores a second release of the same hold', () => {
    const release = acquireScreenSecure()
    release()
    release()
    expect(screenSecureSnapshot()).toEqual({ settingsCover: false, holds: 0, secure: false })
  })
})
