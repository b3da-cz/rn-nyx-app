import React, { useContext, useEffect, useState } from 'react'
import { BackHandler, ScrollView, useWindowDimensions, View } from 'react-native'
import { Text, TextInput, TouchableRipple } from 'react-native-paper'
import { useFocusEffect } from '@react-navigation/native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/Feather'
import type { EventArea, EventCalendarDay, EventCategory } from 'nyx-api'
import { ButtonComponent } from './ButtonComponent'
import { FormRowSelectComponent } from './FormRowSelectComponent'
import {
  CalendarCell,
  defaultEventFilters,
  EVENT_MONTHS,
  EVENT_WEEKDAY_LABELS,
  EventListFilters,
  isoDate,
  isEventFilterActive,
  MainContext,
  monthGrid,
  Styling,
  t,
  useTheme,
} from '../lib'

type Props = {
  navigation: any
  filters: EventListFilters
  categories: EventCategory[]
  areas: EventArea[]
  calendar: Record<string, EventCalendarDay>
  onChange: (filters: EventListFilters) => void
}

export const EventsFilterBarComponent = ({ navigation, filters, categories, areas, calendar, onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(filters.search)
  const [bodyHeight, setBodyHeight] = useState(0)
  const { height, width } = useWindowDimensions()
  const { config } = useContext(MainContext)
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const todayIso = isoDate(new Date())

  useEffect(() => {
    setSearch(filters.search)
  }, [filters.search])

  useEffect(() => {
    const tabs = navigation?.getParent?.()
    if (!tabs?.setOptions) {
      return
    }
    if (isOpen) {
      tabs.setOptions({ swipeEnabled: false })
    }
    return () => {
      tabs.setOptions({ swipeEnabled: !!config?.isNavGesturesEnabled })
    }
  }, [config?.isNavGesturesEnabled, isOpen, navigation])

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!isOpen) {
          return false
        }
        setIsOpen(false)
        return true
      })
      return () => subscription.remove()
    }, [isOpen]),
  )

  const toggle = () => setIsOpen(open => !open)
  const close = () => setIsOpen(false)
  const apply = (next: EventListFilters, shouldClose: boolean) => {
    onChange(next)
    if (shouldClose) {
      close()
    }
  }
  const shiftMonth = (delta: number) => {
    const date = new Date(filters.year, filters.month - 1 + delta, 1)
    onChange({ ...filters, search, month: date.getMonth() + 1, year: date.getFullYear() })
  }

  const epochLabel = /^\d{4}-\d{2}-\d{2}$/.test(filters.epoch)
    ? filters.epoch.split('-').reverse().join('.')
    : t(`events.epoch.${filters.epoch}`)
  const categoryLabel =
    categories.find(category => category.id === filters.category)?.name || t('all')
  const areaLabel = areas.find(area => area.id === filters.area)?.name || t('all')

  return (
    <View
      style={[
        Styling.groups.shadow,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          backgroundColor: colors.background,
        },
      ]}>
      <TouchableRipple rippleColor={colors.ripple} onPress={toggle}>
        <View style={[Styling.groups.flexRowSpbCentered, { height: 50, paddingRight: blocks.large }]}>
          <Text style={{ fontSize: fontSizes.p + 2, marginLeft: blocks.large }}>{t('events.title')}</Text>
          <Icon name={'search'} size={20} color={isEventFilterActive(filters) ? colors.accent : colors.text} />
        </View>
      </TouchableRipple>
      {isOpen && (
        <ScrollView
          keyboardShouldPersistTaps={'handled'}
          keyboardDismissMode={'on-drag'}
          style={{ height: bodyHeight > 0 ? Math.min(bodyHeight, height - 96) : undefined, flexGrow: 0 }}
          onContentSizeChange={(_, nextHeight) => {
            if (Math.abs(nextHeight - bodyHeight) > 1) {
              setBodyHeight(nextHeight)
            }
          }}>
            <PanGestureHandler
              activeOffsetX={[-16, 16]}
              failOffsetY={[-24, 24]}
              onHandlerStateChange={event => {
                if (event.nativeEvent.state !== State.END) {
                  return
                }
                const dx = event.nativeEvent.translationX
                if (dx > 48) {
                  shiftMonth(-1)
                } else if (dx < -48) {
                  shiftMonth(1)
                }
              }}>
              <View collapsable={false}>
                <MonthPage
                  width={width}
                  year={filters.year}
                  month={filters.month}
                  calendar={calendar}
                  todayIso={todayIso}
                  selectedIso={/^\d{4}-\d{2}-\d{2}$/.test(filters.epoch) ? filters.epoch : ''}
                  onPick={iso => apply({ ...filters, search, epoch: iso }, true)}
                />
              </View>
            </PanGestureHandler>
            <TextInput
              numberOfLines={1}
              textAlignVertical={'center'}
              selectionColor={colors.primary}
              onChangeText={setSearch}
              value={search}
              placeholder={t('events.search')}
              style={{ marginHorizontal: blocks.medium, marginBottom: blocks.small, height: 42, backgroundColor: 'inherit' }}
            />
            <FilterRow label={t('events.sortBy')}>
              <FormRowSelectComponent
                value={t(`events.sort.${filters.order}`)}
                options={[
                  { value: 'popularity', label: t('events.sort.popularity') },
                  { value: 'proximity', label: t('events.sort.proximity') },
                  { value: 'freshness', label: t('events.sort.freshness') },
                ]}
                onSelect={order => {
                  if (order === 'popularity' || order === 'proximity' || order === 'freshness') {
                    apply({ ...filters, search, order }, false)
                  }
                }}
              />
            </FilterRow>
            <FilterRow label={t('events.when')}>
              <FormRowSelectComponent
                value={epochLabel}
                options={[
                  { value: 'future', label: t('events.epoch.future') },
                  { value: 'past', label: t('events.epoch.past') },
                  { value: 'all', label: t('events.epoch.all') },
                ]}
                onSelect={epoch => {
                  if (epoch === 'future' || epoch === 'past' || epoch === 'all') {
                    apply({ ...filters, search, epoch }, false)
                  }
                }}
              />
            </FilterRow>
            <FilterRow label={t('events.who')}>
              <FormRowSelectComponent
                value={t(`events.attendance.${filters.attendance}`)}
                options={[
                  { value: 'any', label: t('events.attendance.any') },
                  { value: 'me', label: t('events.attendance.me') },
                  { value: 'friends', label: t('events.attendance.friends') },
                ]}
                onSelect={attendance => {
                  if (attendance === 'any' || attendance === 'me' || attendance === 'friends') {
                    apply({ ...filters, search, attendance }, false)
                  }
                }}
              />
            </FilterRow>
            <FilterRow label={t('events.category')}>
              <FormRowSelectComponent
                hasAll
                value={categoryLabel}
                options={categories.map(category => ({ value: `${category.id}`, label: category.name }))}
                onSelect={value =>
                  apply({ ...filters, search, category: !value || value === 'all' ? undefined : Number(value) }, false)
                }
              />
            </FilterRow>
            <FilterRow label={t('events.area')}>
              <FormRowSelectComponent
                hasAll
                value={areaLabel}
                options={areas.map(area => ({ value: `${area.id}`, label: area.name }))}
                onSelect={value =>
                  apply(
                    { ...filters, search, area: !value || value === 'all' ? undefined : Number(value) },
                    false,
                  )
                }
              />
            </FilterRow>
            <View style={{ flexDirection: 'row', marginTop: blocks.medium }}>
              <ButtonComponent
                label={t('search.clear')}
                color={colors.faded}
                backgroundColor={'inherit'}
                fontSize={fontSizes.p}
                width={'50%'}
                onPress={() => {
                  setSearch('')
                  apply(defaultEventFilters(), true)
                }}
              />
              <ButtonComponent
                label={t('search.do')}
                color={colors.accent}
                backgroundColor={'inherit'}
                fontSize={fontSizes.p}
                width={'50%'}
                onPress={() => apply({ ...filters, search }, true)}
              />
            </View>
        </ScrollView>
      )}
    </View>
  )
}

const FilterRow = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        marginBottom: blocks.small,
        paddingLeft: blocks.medium,
      }}>
      <Text style={{ color: colors.faded, fontSize: fontSizes.p }}>{label}</Text>
      {children}
    </View>
  )
}

const MonthPage = ({
  width,
  year,
  month,
  calendar,
  todayIso,
  selectedIso,
  onPick,
}: {
  width: number
  year: number
  month: number
  calendar: Record<string, EventCalendarDay>
  todayIso: string
  selectedIso: string
  onPick: (iso: string) => void
}) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  const cells = monthGrid(year, month)
  const cellWidth = width / 7
  return (
    <View style={{ width, paddingBottom: 8 }}>
      <Text style={{ color: colors.faded, fontSize: fontSizes.p, paddingHorizontal: 12, paddingVertical: 8 }}>
        {EVENT_MONTHS[month - 1]}
        {year === new Date().getFullYear() ? '' : ` ${year}`}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {EVENT_WEEKDAY_LABELS.map(label => (
          <Text
            key={label}
            style={{ width: cellWidth, textAlign: 'center', color: colors.faded, fontSize: fontSizes.small }}>
            {label}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map(cell => (
          <DayCell
            key={cell.iso}
            cell={cell}
            width={cellWidth}
            hasEvents={(calendar[cell.iso]?.event_count_total || 0) > 0}
            isToday={cell.iso === todayIso}
            isSelected={cell.iso === selectedIso}
            onPick={onPick}
          />
        ))}
      </View>
    </View>
  )
}

const DayCell = ({
  cell,
  width,
  hasEvents,
  isToday,
  isSelected,
  onPick,
}: {
  cell: CalendarCell
  width: number
  hasEvents: boolean
  isToday: boolean
  isSelected: boolean
  onPick: (iso: string) => void
}) => {
  const { colors } = useTheme()
  const textColor = isSelected ? colors.background : cell.inMonth ? colors.text : colors.disabled
  return (
    <TouchableRipple
      rippleColor={colors.ripple}
      onPress={() => onPick(cell.iso)}
      style={{
        width,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isSelected ? colors.primary : hasEvents ? colors.border : 'transparent',
        borderWidth: isToday && !isSelected ? 1 : 0,
        borderColor: colors.accent,
      }}>
      <Text style={{ color: textColor, fontWeight: isToday || isSelected ? '700' : '400' }}>{cell.date.getDate()}</Text>
    </TouchableRipple>
  )
}
