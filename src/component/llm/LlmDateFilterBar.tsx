import React from 'react'
import { Platform } from 'react-native'
import { Button, Text } from 'react-native-paper'
import { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { isoDate, t, useTheme } from '../../lib'
import { FormRowSelectComponent } from '../FormRowSelectComponent'
import { LlmFormRow } from './LlmFormRow'
import { formatLlmDate } from './llmFormat'

export type DatePreset = 'today' | 'yesterday' | '3days' | 'week' | 'all' | 'custom'

type Props = {
  datePreset: DatePreset
  dateFrom: string
  dateTo: string
  onPresetChange: (preset: DatePreset) => void
  onDateFromChange: (val: string) => void
  onDateToChange: (val: string) => void
}

export const LlmDateFilterBar: React.FC<Props> = ({
  datePreset,
  dateFrom,
  dateTo,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
}) => {
  const { colors } = useTheme()

  const openPicker = (target: 'from' | 'to') => {
    const currentValue = target === 'from' ? dateFrom : dateTo
    const initialDate = currentValue && !isNaN(Date.parse(currentValue)) ? new Date(currentValue) : new Date()

    if (Platform.OS === 'android' && DateTimePickerAndroid) {
      try {
        DateTimePickerAndroid.open({
          value: initialDate,
          mode: 'date',
          is24Hour: true,
          onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
            if (event.type === 'set' && selectedDate) {
              const formatted = isoDate(selectedDate)
              if (target === 'from') {
                onDateFromChange(formatted)
              } else {
                onDateToChange(formatted)
              }
              onPresetChange('custom')
            }
          },
        })
      } catch (e) {
        console.warn('DateTimePickerAndroid error', e)
      }
    }
  }

  const presets: { value: DatePreset; label: string }[] = [
    { value: 'today', label: t('llm.today') },
    { value: 'yesterday', label: t('llm.yesterdayAndToday') },
    { value: '3days', label: t('llm.last3Days') },
    { value: 'week', label: t('llm.lastWeek') },
    { value: 'all', label: t('llm.allLoaded') },
  ]
  const presetLabel =
    datePreset === 'custom' ? t('llm.custom') : presets.find(p => p.value === datePreset)?.label || ''

  return (
    <>
      <LlmFormRow label={t('llm.dateRange')}>
        <FormRowSelectComponent
          value={presetLabel}
          options={presets}
          onSelect={(preset: DatePreset) => onPresetChange(preset)}
        />
      </LlmFormRow>
      <LlmFormRow label={`${t('llm.dateFrom')} – ${t('llm.dateTo')}`}>
        <Button compact uppercase={false} color={colors.text} onPress={() => openPicker('from')}>
          {dateFrom ? formatLlmDate(dateFrom) : '…'}
        </Button>
        <Text style={{ color: colors.faded }}>–</Text>
        <Button compact uppercase={false} color={colors.text} onPress={() => openPicker('to')}>
          {dateTo ? formatLlmDate(dateTo) : '…'}
        </Button>
      </LlmFormRow>
    </>
  )
}
