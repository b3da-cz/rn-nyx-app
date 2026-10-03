import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from 'react-native'
import type { EventListItem } from 'nyx-api'
import { EventTimelineBlock, EventTimelineDay, FormRowSelectComponent, StackHeaderComponent } from '../component'
import type { TimelineBlockModel } from '../component'
import {
  addCoverage,
  coverageForEpoch,
  dayCoverage,
  eventMetaParts,
  extendTimelineDays,
  initialTimelineDays,
  isIsoCovered,
  isoDate,
  layoutTimelineLanes,
  MainContext,
  mergeTimelineEvents,
  normalizeTimelineVisibleDays,
  placeTimelineEvents,
  Storage,
  TimelineCoverage,
  TimelineDay,
  t,
  timelineBlockFrame,
  timelineDayPlural,
  timelineNowTop,
  timelineSpanClock,
  timelineTicks,
  timelineTopIndex,
  timelineVisibleDayOptions,
  TIMELINE_CHUNK_DAYS,
  TIMELINE_DATE_WIDTH,
  TIMELINE_MAJOR_TICK_WIDTH,
  TIMELINE_NOW_LINE,
  TIMELINE_TICK_LABEL_GAP,
  useTheme,
} from '../lib'

type Props = {
  navigation: any
}

const EDGE_ROWS = 2
const COLUMN_GAP = 3

function timelineDaysLabel(days: number) {
  const count = normalizeTimelineVisibleDays(days)
  const form = timelineDayPlural(count)
  const key =
    form === 'one' ? 'events.timelineDayOne' : form === 'few' ? 'events.timelineDayFew' : 'events.timelineDayMany'
  return `${t(key)}`.replace('%s', `${count}`)
}

const TimelineHeader = ({
  navigation,
  options,
  back,
  onSelect,
}: {
  navigation: any
  options: { title?: string }
  back?: { title?: string }
  onSelect: (days: number) => void
}) => {
  const context = useContext(MainContext)
  const configured = normalizeTimelineVisibleDays(context.config?.eventTimelineVisibleDays)
  const [days, setDays] = useState(configured)
  useEffect(() => {
    setDays(configured)
  }, [configured])
  return (
    <StackHeaderComponent
      navigation={navigation}
      options={{ ...options, title: t('events.timelineTitle') }}
      back={back}
      theme={context.theme}
      right={
        <FormRowSelectComponent
          value={timelineDaysLabel(days)}
          selectionColor={context.theme?.colors?.text}
          options={timelineVisibleDayOptions()}
          onSelect={(value: string) => {
            const next = normalizeTimelineVisibleDays(value)
            setDays(next)
            onSelect(next)
          }}
        />
      }
    />
  )
}

function plain(value?: string | null) {
  return (value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const EventTimelineView = ({ navigation }: Props) => {
  const context = useContext(MainContext)
  const theme = useTheme()
  const nowRef = useRef(new Date())
  const scrollRef = useRef<ScrollView>(null)
  const offsetRef = useRef(0)
  const prependCount = useRef(0)
  const holdScroll = useRef(false)
  const extending = useRef<'future' | 'past' | null>(null)
  const requestRef = useRef(0)
  const requestedDays = useRef(new Set<string>())
  const visibleIsos = useRef<string[]>([])
  const coverageRef = useRef<TimelineCoverage[]>([])
  const readyRef = useRef(false)
  const daysRef = useRef<TimelineDay[]>([])
  const configuredDays = normalizeTimelineVisibleDays(context.config?.eventTimelineVisibleDays)
  const [visibleDays, setVisibleDays] = useState(configuredDays)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [zeroLabelWidth, setZeroLabelWidth] = useState(0)
  const [listWidth, setListWidth] = useState(0)
  const [listHeight, setListHeight] = useState(0)
  const [trackWidth, setTrackWidth] = useState(0)
  const rowHeight = listHeight > 1 ? listHeight / visibleDays : 0
  const [days, setDays] = useState(() => initialTimelineDays(nowRef.current))
  const [events, setEvents] = useState<EventListItem[]>([])
  const [coverage, setCoverage] = useState<TimelineCoverage[]>([])
  const [ready, setReady] = useState(false)
  const topIndex = useRef(timelineTopIndex(days, nowRef.current)).current
  const todayIso = useRef(isoDate(nowRef.current)).current
  coverageRef.current = coverage
  readyRef.current = ready
  daysRef.current = days

  useEffect(() => {
    setVisibleDays(configuredDays)
  }, [configuredDays])

  useEffect(() => {
    const tick = () => setNowMs(Date.now())
    const id = setInterval(tick, 30000)
    const focus = navigation.addListener('focus', tick)
    return () => {
      clearInterval(id)
      focus()
    }
  }, [navigation])

  const persistTimelineDays = useCallback(
    async (days: number) => {
      const next = normalizeTimelineVisibleDays(days)
      if (context.config) {
        context.config.eventTimelineVisibleDays = next
      }
      const conf = (await Storage.getConfig()) || {}
      conf.eventTimelineVisibleDays = next
      await Storage.setConfig(conf)
    },
    [context.config],
  )

  const onTimelineDays = useCallback(
    (days: number) => {
      setVisibleDays(days)
      void persistTimelineDays(days)
    },
    [persistTimelineDays],
  )
  const onTimelineDaysRef = useRef(onTimelineDays)
  onTimelineDaysRef.current = onTimelineDays

  useLayoutEffect(() => {
    navigation.setOptions({
      header: (props: any) => (
        <TimelineHeader {...props} onSelect={days => onTimelineDaysRef.current(days)} />
      ),
    })
  }, [navigation])

  const placements = useMemo(() => placeTimelineEvents(events), [events])
  const eventsById = useMemo(() => {
    const map = new Map<number, EventListItem>()
    events.forEach(event => {
      if (event.discussion_id != null) {
        map.set(event.discussion_id, event)
      }
    })
    return map
  }, [events])
  const lanes = useMemo(() => layoutTimelineLanes(placements), [placements])

  const blocks = useMemo((): TimelineBlockModel[] => {
    const laneById = new Map(lanes.map(lane => [lane.discussionId, lane]))
    return placements.flatMap(placement => {
      const event = eventsById.get(placement.discussionId)
      const lane = laneById.get(placement.discussionId)
      if (!event || !lane || event.my_attendance === 'none' || event.my_attendance == null) {
        return []
      }
      return [
        {
          ...lane,
          discussionId: placement.discussionId,
          title: event.full_name,
          summary: plain(event.summary) || eventMetaParts(event).place,
          clock: timelineSpanClock(placement.startMs, placement.endMs),
          attendance: event.my_attendance === 'interested' ? 'interested' : 'going',
          friends: event.friends || [],
          startMs: placement.startMs,
          endMs: placement.endMs,
        },
      ]
    })
  }, [eventsById, lanes, placements])

  const consider = useCallback(
    (isos: string[]) => {
      const api = context.nyx?.api
      if (!api || !readyRef.current) {
        return
      }
      isos.forEach(iso => {
        if (!iso || isIsoCovered(coverageRef.current, iso) || requestedDays.current.has(iso)) {
          return
        }
        requestedDays.current.add(iso)
        api
          .getEvents({ epoch: iso, order: 'proximity' })
          .then(res => {
            setEvents(prev => mergeTimelineEvents(prev, res?.events || []))
            setCoverage(prev => addCoverage(prev, dayCoverage(iso)))
          })
          .catch(() => {
            requestedDays.current.delete(iso)
          })
      })
    },
    [context.nyx],
  )

  const reload = useCallback(async () => {
    const api = context.nyx?.api
    const requestId = ++requestRef.current
    if (!api) {
      setReady(true)
      return
    }
    try {
      const [futureRes, pastRes] = await Promise.all([
        api.getEvents({ epoch: 'future', order: 'proximity' }),
        api.getEvents({ epoch: 'past', order: 'proximity' }),
      ])
      if (requestId !== requestRef.current) {
        return
      }
      const future = futureRes?.events || []
      const past = pastRes?.events || []
      requestedDays.current.clear()
      setEvents(mergeTimelineEvents([], [...future, ...past]))
      setCoverage(
        addCoverage(
          [coverageForEpoch('future', future, nowRef.current)],
          coverageForEpoch('past', past, nowRef.current),
        ),
      )
      setReady(true)
    } catch {
      if (requestId === requestRef.current) {
        setReady(true)
      }
    }
  }, [context.nyx])

  useEffect(() => {
    reload()
    const focus = navigation.addListener('focus', () => reload())
    return () => focus()
  }, [navigation, reload])

  const considerRef = useRef(consider)
  considerRef.current = consider

  const syncVisible = useCallback(
    (y: number, viewport: number) => {
      if (!rowHeight) {
        return
      }
      const list = daysRef.current
      const first = Math.max(0, Math.floor(y / rowHeight) - 1)
      const count = Math.ceil(viewport / rowHeight) + 3
      visibleIsos.current = list.slice(first, first + count).map(day => day.iso)
      considerRef.current(visibleIsos.current)
    },
    [rowHeight],
  )

  const anchoredDays = useRef<number | null>(null)
  useEffect(() => {
    if (!rowHeight || anchoredDays.current === visibleDays) {
      return
    }
    anchoredDays.current = visibleDays
    const y = topIndex * rowHeight
    offsetRef.current = y
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y, animated: false }))
  }, [rowHeight, topIndex, visibleDays])

  useEffect(() => {
    if (ready && rowHeight && listHeight) {
      syncVisible(offsetRef.current, listHeight)
    }
  }, [ready, rowHeight, listHeight, days, syncVisible])

  const extend = (edge: 'future' | 'past') => {
    if (days.length > 1200) {
      return
    }
    extending.current = edge
    if (edge === 'past') {
      prependCount.current = TIMELINE_CHUNK_DAYS
    }
    setDays(prev => extendTimelineDays(prev, edge, TIMELINE_CHUNK_DAYS))
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!rowHeight) {
      return
    }
    const y = event.nativeEvent.contentOffset.y
    const viewport = event.nativeEvent.layoutMeasurement.height
    const content = event.nativeEvent.contentSize.height
    const edge = rowHeight * EDGE_ROWS
    offsetRef.current = y
    syncVisible(y, viewport)
    if (holdScroll.current) {
      if (y > edge) {
        holdScroll.current = false
      }
      return
    }
    if (extending.current === 'past' && y > edge) {
      extending.current = null
    }
    if (extending.current === 'future' && content - (y + viewport) > edge) {
      extending.current = null
    }
    if (extending.current) {
      return
    }
    if (y < edge) {
      extend('past')
      return
    }
    if (content - (y + viewport) < edge) {
      extend('future')
    }
  }

  const onContentSizeChange = () => {
    const added = prependCount.current
    if (!added || !rowHeight) {
      return
    }
    const next = offsetRef.current + added * rowHeight
    prependCount.current = 0
    holdScroll.current = true
    offsetRef.current = next
    scrollRef.current?.scrollTo({ y: next, animated: false })
  }

  const dividerInset =
    TIMELINE_MAJOR_TICK_WIDTH +
    TIMELINE_TICK_LABEL_GAP * 2 +
    (zeroLabelWidth || theme.metrics.fontSizes.small * 0.7)
  const originIso = days[0]?.iso
  const initialOffset = topIndex * rowHeight
  const ticks = useMemo(
    () => (originIso ? timelineTicks(originIso, days.length, rowHeight, visibleDays) : []),
    [originIso, days.length, rowHeight, visibleDays],
  )

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      onLayout={event => {
        const nextHeight = event.nativeEvent.layout.height
        const nextWidth = event.nativeEvent.layout.width
        const nextTrack = nextWidth - TIMELINE_DATE_WIDTH - 8
        setListHeight(prev => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev))
        setListWidth(prev => (Math.abs(prev - nextWidth) > 1 ? nextWidth : prev))
        setTrackWidth(prev => (Math.abs(prev - nextTrack) > 1 ? nextTrack : prev))
      }}
    >
      {rowHeight > 0 && (
        <ScrollView
          ref={scrollRef}
          contentOffset={{ x: 0, y: initialOffset }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onContentSizeChange={onContentSizeChange}
        >
          <View style={{ height: days.length * rowHeight, width: listWidth || '100%' }}>
            {days.map(day => (
              <EventTimelineDay
                key={day.iso}
                day={day}
                height={rowHeight}
                isToday={day.iso === todayIso}
                dividerInset={dividerInset}
              />
            ))}
            {originIso && listWidth > 0 && (
              <View
                pointerEvents={'none'}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: timelineNowTop(nowMs, originIso, rowHeight),
                  width: listWidth,
                  height: TIMELINE_NOW_LINE,
                  backgroundColor: theme.colors.primary,
                  zIndex: 1,
                }}
              />
            )}
            {ticks.map(tick => (
              <View
                key={tick.key}
                pointerEvents={'none'}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: tick.top,
                  width: tick.width,
                  height: tick.height,
                  backgroundColor: tick.major ? theme.colors.text : theme.colors.faded,
                  zIndex: 1,
                }}
              />
            ))}
            {ticks.map(tick => {
              if (!tick.label) {
                return null
              }
              const labelSize = theme.metrics.fontSizes.small
              const center = tick.top + tick.height / 2
              return (
                <Text
                  key={`${tick.key}-label`}
                  pointerEvents={'none'}
                  style={{
                    position: 'absolute',
                    right: tick.width + TIMELINE_TICK_LABEL_GAP,
                    top: center - labelSize / 2,
                    height: labelSize,
                    lineHeight: labelSize,
                    fontSize: labelSize,
                    color: theme.colors.text,
                    textAlign: 'right',
                    zIndex: 1,
                  }}
                  onLayout={
                    tick.label === '0'
                      ? event => {
                          const nextWidth = event.nativeEvent.layout.width
                          setZeroLabelWidth(prev => (prev === nextWidth ? prev : nextWidth))
                        }
                      : undefined
                  }
                >
                  {tick.label}
                </Text>
              )
            })}
            {originIso &&
              blocks.map(block => {
                const frame = timelineBlockFrame(block.startMs, block.endMs, originIso, rowHeight)
                const columnWidth = trackWidth / block.columns
                return (
                  <EventTimelineBlock
                    key={block.discussionId}
                    block={block}
                    top={frame.top}
                    height={frame.height}
                    left={TIMELINE_DATE_WIDTH + columnWidth * block.column + COLUMN_GAP}
                    width={Math.max(0, columnWidth - COLUMN_GAP * 2)}
                    onPress={discussionId => navigation.navigate('discussion', { discussionId })}
                  />
                )
              })}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
