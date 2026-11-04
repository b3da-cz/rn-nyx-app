import { useEffect, useState } from 'react'
import { isoDate } from '../../lib/events'
import { Storage } from '../../lib/Storage'
import { DatePreset } from './LlmDateFilterBar'

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

function subtractMonths(date: Date, months: number): Date {
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() - months)
  if (d.getDate() !== day) {
    d.setDate(0)
  }
  return d
}

function subtractYears(date: Date, years: number): Date {
  const d = new Date(date)
  const day = d.getDate()
  d.setFullYear(d.getFullYear() - years)
  if (d.getDate() !== day) {
    d.setDate(0)
  }
  return d
}

export function computePresetRange(
  preset: DatePreset,
  today = new Date(),
): { dateFrom: string; dateTo: string } {
  const todayStr = isoDate(today)
  if (preset === 'fill_context') {
    return { dateFrom: '', dateTo: todayStr }
  }
  if (preset === 'today') {
    return { dateFrom: todayStr, dateTo: todayStr }
  }
  if (preset === 'yesterday') {
    return { dateFrom: isoDate(subtractDays(today, 1)), dateTo: todayStr }
  }
  if (preset === '3days') {
    return { dateFrom: isoDate(subtractDays(today, 3)), dateTo: todayStr }
  }
  if (preset === 'week') {
    return { dateFrom: isoDate(subtractDays(today, 7)), dateTo: todayStr }
  }
  if (preset === '2weeks') {
    return { dateFrom: isoDate(subtractDays(today, 14)), dateTo: todayStr }
  }
  if (preset === '3weeks') {
    return { dateFrom: isoDate(subtractDays(today, 21)), dateTo: todayStr }
  }
  if (preset === 'month') {
    return { dateFrom: isoDate(subtractMonths(today, 1)), dateTo: todayStr }
  }
  if (preset === '3months') {
    return { dateFrom: isoDate(subtractMonths(today, 3)), dateTo: todayStr }
  }
  if (preset === '6months') {
    return { dateFrom: isoDate(subtractMonths(today, 6)), dateTo: todayStr }
  }
  if (preset === 'year') {
    return { dateFrom: isoDate(subtractYears(today, 1)), dateTo: todayStr }
  }
  if (preset === 'all') {
    return { dateFrom: '', dateTo: '' }
  }
  return { dateFrom: todayStr, dateTo: todayStr }
}

export function useLlmDateFilter(discussionId?: number | string) {
  const [datePreset, setDatePreset] = useState<DatePreset>('today')
  const [dateFrom, setDateFrom] = useState(() => isoDate(new Date()))
  const [dateTo, setDateTo] = useState(() => isoDate(new Date()))
  const [isLoaded, setIsLoaded] = useState(!discussionId)

  useEffect(() => {
    if (!discussionId) {
      setIsLoaded(true)
      return
    }
    let cancelled = false
    Storage.getLlmClubDateFilter(discussionId)
      .then(saved => {
        if (cancelled) {
          return
        }
        if (saved?.preset) {
          setDatePreset(saved.preset as DatePreset)
          if (saved.preset === 'custom') {
            if (saved.dateFrom) setDateFrom(saved.dateFrom)
            if (saved.dateTo) setDateTo(saved.dateTo)
          } else {
            const range = computePresetRange(saved.preset as DatePreset, new Date())
            setDateFrom(range.dateFrom)
            setDateTo(range.dateTo)
          }
        }
        setIsLoaded(true)
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [discussionId])

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset)
    let nextFrom = dateFrom
    let nextTo = dateTo
    if (preset !== 'custom') {
      const range = computePresetRange(preset, new Date())
      nextFrom = range.dateFrom
      nextTo = range.dateTo
      setDateFrom(nextFrom)
      setDateTo(nextTo)
    }
    if (discussionId) {
      void Storage.setLlmClubDateFilter(discussionId, {
        preset,
        dateFrom: preset === 'custom' ? nextFrom : undefined,
        dateTo: preset === 'custom' ? nextTo : undefined,
      })
    }
  }

  const handleDateFromChange = (val: string) => {
    setDateFrom(val)
    if (discussionId) {
      void Storage.setLlmClubDateFilter(discussionId, {
        preset: 'custom',
        dateFrom: val,
        dateTo,
      })
    }
  }

  const handleDateToChange = (val: string) => {
    setDateTo(val)
    if (discussionId) {
      void Storage.setLlmClubDateFilter(discussionId, {
        preset: 'custom',
        dateFrom,
        dateTo: val,
      })
    }
  }

  return {
    datePreset,
    dateFrom,
    dateTo,
    setDateFrom: handleDateFromChange,
    setDateTo: handleDateToChange,
    setInternalDateFrom: setDateFrom,
    setInternalDateTo: setDateTo,
    applyPreset,
    isLoaded,
    setDatePreset,
  }
}
