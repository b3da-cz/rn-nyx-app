import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FlatList, InteractionManager, RefreshControl, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useIsFocused } from '@react-navigation/native'
import type { EventArea, EventCalendarDay, EventCategory, EventListItem } from 'nyx-api'
import { EventsFilterBarComponent, EventRowComponent, FabComponent } from '../component'
import {
  defaultEventFilters,
  EventListFilters,
  eventsCacheKey,
  filterEventsByAttendance,
  MainContext,
  readFeedCache,
  reconcileEvents,
  rememberEventsQuery,
  t,
  toEventsQuery,
  updateFeedCache,
  useTheme,
} from '../lib'

type Props = {
  navigation: any
}

export const EventsView = ({ navigation }: Props) => {
  const context = useContext(MainContext)
  const theme = useTheme()
  const isFocused = useIsFocused()
  const [filters, setFilters] = useState<EventListFilters>(defaultEventFilters())
  const [events, setEvents] = useState<EventListItem[]>([])
  const [calendar, setCalendar] = useState<Record<string, EventCalendarDay>>({})
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [areas, setAreas] = useState<EventArea[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const filtersRef = useRef(filters)
  const requestRef = useRef(0)
  const listRef = useRef<FlatList<EventListItem>>(null)
  const unfilteredRef = useRef<EventListItem[]>([])
  const eventsKeyRef = useRef('')
  filtersRef.current = filters
  const cacheOn = context.config?.isDiscussionCacheEnabled !== false

  const load = useCallback(
    async (next = filtersRef.current, silent = false) => {
      const requestId = ++requestRef.current
      if (!silent) {
        setIsFetching(true)
      }
      const key = eventsCacheKey(next)
      if (eventsKeyRef.current !== key) {
        eventsKeyRef.current = key
        unfilteredRef.current = []
        setEvents([])
      }
      let base = unfilteredRef.current
      if (base.length) {
        setEvents(filterEventsByAttendance(base, next.attendance))
      }
      let showedCache = false
      if (cacheOn && !base.length) {
        const store = await readFeedCache()
        const hit = store.events?.queries?.[key]
        if (requestId !== requestRef.current) {
          return
        }
        if (hit?.events?.length) {
          base = hit.events
          unfilteredRef.current = hit.events
          setEvents(filterEventsByAttendance(hit.events, next.attendance))
          setCalendar(hit.calendar || {})
          if (hit.categories?.length) {
            setCategories(hit.categories)
          }
          if (hit.areas?.length) {
            setAreas(hit.areas)
          }
          showedCache = true
          setIsFetching(true)
        }
      }
      context.nyx?.holdErrors()
      let servedFromCache = false
      try {
        const res = await context.nyx?.api.getEvents(toEventsQuery(next))
        if (requestId !== requestRef.current) {
          return
        }
        if (!res || res.error || !Array.isArray(res.events)) {
          servedFromCache = showedCache || base.length > 0
          setIsFetching(false)
          return
        }
        const merged = reconcileEvents(base, res.events || [])
        unfilteredRef.current = merged.items
        setEvents(filterEventsByAttendance(merged.items, next.attendance))
        setCalendar(res.calendar || {})
        if (res.categories?.length) {
          setCategories(res.categories)
        }
        if (res.areas?.length) {
          setAreas(res.areas)
        }
        setIsFetching(false)
        if (cacheOn) {
          updateFeedCache(store => {
            const previous = store.events?.queries?.[key]
            return rememberEventsQuery(store, key, {
              events: merged.items,
              calendar: res.calendar || previous?.calendar || {},
              categories: res.categories?.length ? res.categories : previous?.categories || [],
              areas: res.areas?.length ? res.areas : previous?.areas || [],
            })
          }).catch(e => console.warn(e))
        }
      } catch (e) {
        console.warn(e)
        if (requestId === requestRef.current) {
          servedFromCache = showedCache || base.length > 0
          setIsFetching(false)
        }
      } finally {
        context.nyx?.releaseErrors(servedFromCache)
      }
    },
    [cacheOn, context.nyx],
  )

  useEffect(() => {
    let unmounted = false
    InteractionManager.runAfterInteractions(() => {
      if (unmounted) {
        return
      }
      const isFocused = typeof navigation?.isFocused === 'function' ? navigation.isFocused() : true
      if (isFocused) {
        load(filtersRef.current, true)
      }
    })
    const focus = navigation.addListener('focus', () => {
      InteractionManager.runAfterInteractions(() => {
        if (unmounted) {
          return
        }
        const isFocused = typeof navigation?.isFocused === 'function' ? navigation.isFocused() : true
        if (isFocused) {
          load(filtersRef.current, true)
        }
      })
    })
    const tabPress = navigation.getParent()?.addListener('tabPress', () => {
      const isFocused = typeof navigation?.isFocused === 'function' ? navigation.isFocused() : true
      if (isFocused) {
        load(filtersRef.current, true)
      }
    })
    return () => {
      unmounted = true
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
        contentContainerStyle={{ paddingTop: 50, paddingBottom: 88, flexGrow: 1 }}
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
            onPress={() => {
              if (item.discussion_id == null) {
                return
              }
              navigation.navigate('discussion', { discussionId: item.discussion_id })
            }}
          />
        )}
      />
      <FabComponent
        isVisible={isFocused}
        iconOpen={'close'}
        iconClosed={'plus'}
        paddingBottom={context.config?.isBottomTabs ? 45 : 0}
        backgroundColor={theme.colors.primary}
        onPress={() => {}}
        actions={[
          {
            icon: 'calendar',
            label: t('events.timeline'),
            style: { backgroundColor: theme.colors.primary },
            onPress: () => navigation.navigate('eventTimeline'),
          },
          {
            icon: 'plus',
            label: t('events.create'),
            style: { backgroundColor: theme.colors.primary },
            onPress: () => navigation.navigate('eventCreate'),
          },
        ]}
      />
    </View>
  )
}
