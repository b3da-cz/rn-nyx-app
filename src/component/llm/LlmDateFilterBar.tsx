import React from 'react'
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker'
import Icon from 'react-native-vector-icons/Feather'
import { isoDate, t, useTheme } from '../../lib'

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
  const { colors, metrics } = useTheme()

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

  const presets: { id: DatePreset; label: string }[] = [
    { id: 'today', label: t('llm.today') || 'Dnes' },
    { id: 'yesterday', label: t('llm.yesterdayAndToday') || 'Včera' },
    { id: '3days', label: t('llm.last3Days') || '3 dny' },
    { id: 'week', label: t('llm.lastWeek') || 'Týden' },
    { id: 'all', label: t('llm.allLoaded') || 'Vše' },
  ]

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
      <View style={styles.presetsRow}>
        {presets.map(p => {
          const isActive = datePreset === p.id
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => onPresetChange(p.id)}
              style={[
                styles.presetBtn,
                {
                  backgroundColor: isActive ? colors.primary : colors.background,
                  borderColor: isActive ? colors.primary : colors.disabled,
                },
              ]}>
              <Text
                style={{
                  color: isActive ? '#FFFFFF' : colors.text,
                  fontSize: metrics.fontSizes.small,
                  fontWeight: isActive ? '600' : 'normal',
                }}>
                {p.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.dateInputsRow}>
        <TouchableOpacity
          onPress={() => openPicker('from')}
          style={[styles.dateInputBtn, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
          <Icon name="calendar" size={14} color={colors.faded} style={{ marginRight: 6 }} />
          <Text style={{ color: dateFrom ? colors.text : colors.faded, fontSize: metrics.fontSizes.small }}>
            {dateFrom ? `${t('llm.dateFrom') || 'Od'}: ${dateFrom}` : `${t('llm.dateFrom') || 'Od'}: (neomezeno)`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openPicker('to')}
          style={[styles.dateInputBtn, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
          <Icon name="calendar" size={14} color={colors.faded} style={{ marginRight: 6 }} />
          <Text style={{ color: dateTo ? colors.text : colors.faded, fontSize: metrics.fontSizes.small }}>
            {dateTo ? `${t('llm.dateTo') || 'Do'}: ${dateTo}` : `${t('llm.dateTo') || 'Do'}: (neomezeno)`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInputBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
})
