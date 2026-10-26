import { navSheetRowMetrics, navSheetScrollMax, sheetBottomCover } from '../src/lib/navSheet'

describe('sheetBottomCover', () => {
  it('keeps a gap under the last row when SafeAreaView already applied the inset', () => {
    expect(
      sheetBottomCover({ windowHeight: 800, screenHeight: 800, insetBottom: 48 }),
    ).toBe(36)
  })

  it('reserves the nav bar when the window runs to the screen bottom and no inset is reported', () => {
    expect(
      sheetBottomCover({ windowHeight: 800, screenHeight: 800, insetBottom: 0 }),
    ).toBe(48)
  })

  it('reserves the bar when only the status bar sits outside the window', () => {
    expect(
      sheetBottomCover({ windowHeight: 760, screenHeight: 800, insetBottom: 0 }),
    ).toBe(48)
  })

  it('keeps a gap when the nav bar is already outside the window', () => {
    expect(
      sheetBottomCover({ windowHeight: 720, screenHeight: 800, insetBottom: 0 }),
    ).toBe(36)
  })

  it('keeps a gap on platforms without a nav-bar fallback', () => {
    expect(
      sheetBottomCover({ windowHeight: 800, screenHeight: 800, insetBottom: 0, fallbackBar: 0 }),
    ).toBe(36)
  })
})

describe('navSheetScrollMax', () => {
  it('keeps the scrollport above the reserved nav bar', () => {
    expect(navSheetScrollMax(800, 48)).toBe(580)
    expect(navSheetScrollMax(640, 48)).toBe(449)
  })

  it('stays usable on a very short window', () => {
    expect(navSheetScrollMax(180, 48)).toBe(120)
  })
})

describe('navSheetRowMetrics', () => {
  it('keeps the default row at 52', () => {
    expect(navSheetRowMetrics(1)).toMatchObject({ labelSize: 15, rowHeight: 52 })
  })

  it('grows the row with a large system font so the glyph is not clipped', () => {
    const huge = navSheetRowMetrics(2)
    expect(huge.labelSize).toBe(30)
    expect(huge.rowHeight).toBeGreaterThan(52)
  })

  it('treats a missing scale as the default', () => {
    expect(navSheetRowMetrics(0).rowHeight).toBe(52)
  })
})
