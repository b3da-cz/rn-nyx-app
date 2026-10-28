import { useState } from 'react'
import { isoDate } from '../../lib/events'
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

export function useLlmDateFilter() {
  const [datePreset, setDatePreset] = useState<DatePreset>('today')
  const [dateFrom, setDateFrom] = useState(() => isoDate(new Date()))
  const [dateTo, setDateTo] = useState(() => isoDate(new Date()))

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset)
    if (preset === 'custom') {
      return
    }
    const range = computePresetRange(preset, new Date())
    setDateFrom(range.dateFrom)
    setDateTo(range.dateTo)
  }

  return {
    datePreset,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    applyPreset,
  }
}
