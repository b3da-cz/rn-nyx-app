import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { Text } from 'react-native-paper'
import type { EventArea, EventCalendarDay, EventCategory, EventListItem } from 'nyx-api'
import { EventsFilterBarComponent, EventRowComponent } from '../component'
import {
  defaultEventFilters,
  EventListFilters,
  filterEventsByAttendance,
  MainContext,
  t,
  toEventsQuery,
  useTheme,
} from '../lib'

type Props = {
  navigation: any
}

export const EventsView = ({ navigation }: Props) => {
  const context = useContext(MainContext)
  const theme = useTheme()
  const [filters, setFilters] = useState<EventListFilters>(defaultEventFilters())
  const [events, setEvents] = useState<EventListItem[]>([])
  const [calendar, setCalendar] = useState<Record<string, EventCalendarDay>>({})
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [areas, setAreas] = useState<EventArea[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const filtersRef = useRef(filters)
  const requestRef = useRef(0)
  const listRef = useRef<FlatList<EventListItem>>(null)
  filtersRef.current = filters

  const load = useCallback(
    async (next = filtersRef.current, silent = false) => {
      const requestId = ++requestRef.current
      if (!silent) {
        setIsFetching(true)
      }
      const res = await context.nyx?.api.getEvents(toEventsQuery(next))
      if (requestId !== requestRef.current) {
        return
      }
      setEvents(filterEventsByAttendance(res?.events || [], next.attendance))
      setCalendar(res?.calendar || {})
      if (res?.categories?.length) {
        setCategories(res.categories)
      }
      if (res?.areas?.length) {
        setAreas(res.areas)
      }
      setIsFetching(false)
    },
    [context.nyx],
  )

  useEffect(() => {
    load(filtersRef.current)
    const focus = navigation.addListener('focus', () => load(filtersRef.current, true))
    const tabPress = navigation.getParent()?.addListener('tabPress', () => {
      if (navigation.isFocused()) {
        load(filtersRef.current, true)
      }
    })
    return () => {
      focus()
      tabPress?.()
    }
  }, [load, navigation])

  const onChange = (next: EventListFilters) => {
    const listChanged =
      next.order !== filters.order ||
      next.epoch !== filters.epoch ||
      next.attendance !== filters.attendance ||
      next.category !== filters.category ||
      next.area !== filters.area ||
      next.search !== filters.search
    setFilters(next)
    if (!listChanged) {
      return
    }
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
    load(next)
  }

  return (
    <View style={{ backgroundColor: theme.colors.background, flex: 1, height: '100%' }}>
      <EventsFilterBarComponent
        filters={filters}
        categories={categories}
        areas={areas}
        calendar={calendar}
        navigation={navigation}
        onChange={onChange}
      />
      <FlatList
        ref={listRef}
        data={events}
        keyExtractor={event => `${event.discussion_id}`}
        contentContainerStyle={{ paddingTop: 50, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => load(filters)}
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.tertiary]}
          />
        }
        ListEmptyComponent={
          isFetching ? null : (
            <Text style={{ color: theme.colors.faded, textAlign: 'center', marginTop: 24 }}>{t('events.empty')}</Text>
          )
        }
        renderItem={({ item }) => (
          <EventRowComponent
            event={item}
            onPress={() => navigation.push('discussion', { discussionId: item.discussion_id })}
          />
        )}
      />
    </View>
  )
}
