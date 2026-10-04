import { useState } from 'react'
import { isoDate } from '../../lib'
import { DatePreset } from './LlmDateFilterBar'

export function useLlmDateFilter() {
  const [datePreset, setDatePreset] = useState<DatePreset>('today')
  const [dateFrom, setDateFrom] = useState(() => isoDate(new Date()))
  const [dateTo, setDateTo] = useState(() => isoDate(new Date()))

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset)
    const today = new Date()
    const todayStr = isoDate(today)
    if (preset === 'today') {
      setDateFrom(todayStr)
      setDateTo(todayStr)
    } else if (preset === 'yesterday') {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      setDateFrom(isoDate(yesterday))
      setDateTo(todayStr)
    } else if (preset === '3days') {
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
      setDateFrom(isoDate(threeDaysAgo))
      setDateTo(todayStr)
    } else if (preset === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      setDateFrom(isoDate(weekAgo))
      setDateTo(todayStr)
    } else if (preset === 'all') {
      setDateFrom('')
      setDateTo('')
    }
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
