// 3-button navigation is 48dp. Gesture bars are shorter; the sheet still keeps
// a gap under the last row so it never sits on the indicator.
export const ANDROID_NAV_BAR_FALLBACK = 48
export const NAV_SHEET_BOTTOM_GAP = 36
export const NAV_SHEET_HANDLE = 28
export const NAV_SHEET_MAX_RATIO = 0.82

export type SheetCoverInput = {
  windowHeight: number
  screenHeight: number
  // Reported by safe-area. The app SafeAreaView already consumes a non-zero value,
  // so the sheet must not add that bar height a second time.
  insetBottom: number
  fallbackBar?: number
  // Always left under the last row, including on gesture navigation where the
  // reported inset is 0 and the indicator still paints over the sheet.
  minGap?: number
}

/**
 * How far a bottom sheet anchored to the window bottom must lift its content.
 *
 * A non-zero inset is already applied by SafeAreaView around the portal.
 * A window that is shorter than the screen by at least one nav bar already
 * ends above that bar. Otherwise the window runs under the bar and the sheet
 * reserves it. Either way the last row keeps minGap of air under it.
 */
export const sheetBottomCover = ({
  windowHeight,
  screenHeight,
  insetBottom,
  fallbackBar = ANDROID_NAV_BAR_FALLBACK,
  minGap = NAV_SHEET_BOTTOM_GAP,
}: SheetCoverInput) => {
  const reported = Math.max(0, insetBottom || 0)
  const fallback = Math.max(0, fallbackBar || 0)
  const gap = Math.max(0, minGap || 0)
  let overlay = 0
  if (reported === 0 && fallback > 0) {
    if (!(windowHeight > 0) || !(screenHeight > 0) || screenHeight - windowHeight < fallback) {
      overlay = fallback
    }
  }
  return Math.max(overlay, gap)
}

export const navSheetScrollMax = (portalHeight: number, bottomCover: number) => {
  const available =
    Math.round((portalHeight || 0) * NAV_SHEET_MAX_RATIO) - NAV_SHEET_HANDLE - Math.max(0, bottomCover)
  return Math.max(120, available)
}

// System font scale is baked in (and allowFontScaling turned off) because a
// fixed 52dp row clips the glyphs once the user turns the system text up.
export const navSheetRowMetrics = (fontScale: number) => {
  const scale = fontScale > 0 ? fontScale : 1
  const labelSize = 15 * scale
  const labelLine = Math.ceil(labelSize * 1.35)
  return {
    labelSize,
    labelLine,
    rowHeight: Math.max(52, labelLine + 24),
  }
}
