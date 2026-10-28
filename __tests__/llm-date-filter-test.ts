import { computePresetRange } from '../src/component/llm/useLlmDateFilter'

describe('useLlmDateFilter computePresetRange', () => {
  const at = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12, 0, 0)
  const base = at(2026, 10, 28)

  it('computes short presets relative to current day', () => {
    expect(computePresetRange('today', base)).toEqual({ dateFrom: '2026-10-28', dateTo: '2026-10-28' })
    expect(computePresetRange('yesterday', base)).toEqual({ dateFrom: '2026-10-27', dateTo: '2026-10-28' })
    expect(computePresetRange('3days', base)).toEqual({ dateFrom: '2026-10-25', dateTo: '2026-10-28' })
    expect(computePresetRange('week', base)).toEqual({ dateFrom: '2026-10-21', dateTo: '2026-10-28' })
  })

  it('computes 2 weeks, 3 weeks, 1 month, 3 months, 6 months, and 1 year', () => {
    expect(computePresetRange('2weeks', base)).toEqual({ dateFrom: '2026-10-14', dateTo: '2026-10-28' })
    expect(computePresetRange('3weeks', base)).toEqual({ dateFrom: '2026-10-07', dateTo: '2026-10-28' })
    expect(computePresetRange('month', base)).toEqual({ dateFrom: '2026-09-28', dateTo: '2026-10-28' })
    expect(computePresetRange('3months', base)).toEqual({ dateFrom: '2026-07-28', dateTo: '2026-10-28' })
    expect(computePresetRange('6months', base)).toEqual({ dateFrom: '2026-04-28', dateTo: '2026-10-28' })
    expect(computePresetRange('year', base)).toEqual({ dateFrom: '2025-10-28', dateTo: '2026-10-28' })
    expect(computePresetRange('all', base)).toEqual({ dateFrom: '', dateTo: '' })
  })

  it('handles month end day clamping when subtracting months', () => {
    const march31 = at(2026, 3, 31)
    expect(computePresetRange('month', march31)).toEqual({ dateFrom: '2026-02-28', dateTo: '2026-03-31' })
  })
})
