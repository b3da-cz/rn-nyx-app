import React, { useContext, useEffect, useRef, useState } from 'react'
import { BackHandler, LayoutAnimation, Platform, ScrollView, useWindowDimensions, View } from 'react-native'
import { Text, TextInput, TouchableRipple } from 'react-native-paper'
import { useFocusEffect } from '@react-navigation/native'
import PagerView from 'react-native-pager-view'
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
  LayoutAnimConf,
  MainContext,
  monthGrid,
  Styling,
  t,
  useTheme,
  wait,
} from '../lib'

const MONTH_RANGE = 24
const CALENDAR_HEIGHT = 292

const monthAt = (offset: number) => {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

const indexForMonth = (year: number, month: number) => {
  const now = new Date()
  const offset = (year - now.getFullYear()) * 12 + (month - 1 - now.getMonth())
  return Math.min(MONTH_RANGE * 2, Math.max(0, offset + MONTH_RANGE))
}

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
  const [pageIndex, setPageIndex] = useState(() => indexForMonth(filters.year, filters.month))
  const pagerRef = useRef<PagerView>(null)
  const fromPager = useRef(false)
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
        LayoutAnimation.configureNext(LayoutAnimConf.spring)
        setIsOpen(false)
        return true
      })
      return () => subscription.remove()
    }, [isOpen]),
  )

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimConf.spring)
    setIsOpen(open => !open)
  }
  const close = async () => {
    await wait(200)
    LayoutAnimation.configureNext(LayoutAnimConf.spring)
    setIsOpen(false)
  }
  const apply = (next: EventListFilters, shouldClose: boolean) => {
    onChange(next)
    if (shouldClose) {
      close()
    }
  }

  useEffect(() => {
    const index = indexForMonth(filters.year, filters.month)
    setPageIndex(index)
    if (fromPager.current) {
      fromPager.current = false
      return
    }
    pagerRef.current?.setPageWithoutAnimation(index)
  }, [filters.month, filters.year])

  const epochLabel = /^\d{4}-\d{2}-\d{2}$/.test(filters.epoch)
    ? filters.epoch.split('-').reverse().join('.')
    : t(`events.epoch.${filters.epoch}`)
  const categoryLabel =
    categories.find(category => category.id === filters.category)?.name || t('all')
  const areaLabel = areas.find(area => area.id === filters.area)?.name || t('all')

  const selectedIso = /^\d{4}-\d{2}-\d{2}$/.test(filters.epoch) ? filters.epoch : ''
  const pages = Array.from({ length: MONTH_RANGE * 2 + 1 }, (_, index) => index)

  return (
    <View
      pointerEvents={'box-none'}
      style={{
        position: Platform.OS === 'android' || !isOpen ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: Platform.OS === 'android' && isOpen ? 0 : undefined,
        height: isOpen ? undefined : 50,
        zIndex: 2,
        overflow: 'hidden',
      }}>
    <TouchableRipple
      rippleColor={colors.ripple}
      onPress={toggle}
      style={[
        Styling.groups.shadow,
        {
          backgroundColor: colors.background,
          width: '100%',
        },
      ]}>
      <View>
      <View style={[Styling.groups.flexRowSpbCentered, { height: 50, paddingRight: blocks.large }]}>
        <Text style={{ fontSize: fontSizes.p + 2, marginLeft: blocks.large }}>{t('events.title')}</Text>
        <Icon name={'search'} size={20} color={isEventFilterActive(filters) ? colors.accent : colors.text} />
      </View>
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
            <PagerView
              ref={pagerRef}
              style={{ height: CALENDAR_HEIGHT }}
              initialPage={indexForMonth(filters.year, filters.month)}
              offscreenPageLimit={1}
              overdrag
              onPageSelected={event => {
                const index = event.nativeEvent.position
                setPageIndex(index)
                const next = monthAt(index - MONTH_RANGE)
                if (next.year === filters.year && next.month === filters.month) {
                  return
                }
                fromPager.current = true
                onChange({ ...filters, search, year: next.year, month: next.month })
              }}>
              {pages.map(index => {
                const page = monthAt(index - MONTH_RANGE)
                return (
                  <View key={index} collapsable={false} style={{ height: CALENDAR_HEIGHT }}>
                    {Math.abs(index - pageIndex) <= 1 ? (
                      <MonthPage
                        width={width}
                        year={page.year}
                        month={page.month}
                        calendar={calendar}
                        todayIso={todayIso}
                        selectedIso={selectedIso}
                        onPick={iso => apply({ ...filters, search, epoch: iso }, true)}
                      />
                    ) : null}
                  </View>
                )
              })}
            </PagerView>
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
    </TouchableRipple>
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

const DAY_HEIGHT = 36
const DAY_INSET = 3
const FRAME_GAP = 2

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
  const framed = isToday || isSelected
  const fill = isSelected ? colors.primary : hasEvents ? colors.border : undefined
  const textColor = isSelected ? colors.background : cell.inMonth ? colors.text : colors.disabled
  return (
    <TouchableRipple
      rippleColor={colors.ripple}
      onPress={() => onPick(cell.iso)}
      style={{
        width,
        height: DAY_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: width - DAY_INSET * 2,
          height: DAY_HEIGHT - DAY_INSET * 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: framed ? 1 : 0,
          borderColor: colors.accent,
        }}>
        {!!fill && (
          <View
            style={{
              position: 'absolute',
              top: framed ? FRAME_GAP : 0,
              right: framed ? FRAME_GAP : 0,
              bottom: framed ? FRAME_GAP : 0,
              left: framed ? FRAME_GAP : 0,
              backgroundColor: fill,
            }}
          />
        )}
        <Text style={{ color: textColor, fontWeight: isToday || isSelected ? '700' : '400' }}>{cell.date.getDate()}</Text>
      </View>
    </TouchableRipple>
  )
}
