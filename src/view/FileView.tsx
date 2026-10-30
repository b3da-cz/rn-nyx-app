import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { SearchFieldComponent } from '../component'
import { LlmSegmentedRow } from '../component/llm'
import { LoaderComponent } from '../component/LoaderComponent'
import { countMarkdownSearchHits, MarkdownViewComponent } from '../component/MarkdownViewComponent'
import { SearchHighlight } from '../component/SearchHighlight'
import { SourceCodeView } from '../component/SourceCodeView'
import { MainContext, readCachedText, searchMatchRanges, sourceLangFor, t, textFileExtOf, useTheme } from '../lib'
import { scrollOffsetForWindowTarget } from '../lib/fileSearchScroll'

type Props = {
  path?: string
  name: string
  external?: boolean
  source?: string
  inline?: boolean
}

export const FileView = ({ path = '', name, source, inline = false }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const ext = textFileExtOf(name) || 'txt'
  const [mode, setMode] = useState<'raw' | 'parsed'>('parsed')
  const [query, setQuery] = useState('')
  const [activeRaw, setActiveRaw] = useState(0)
  const [activeParsed, setActiveParsed] = useState(0)
  const [text, setText] = useState<string | null>(null)
  const avatars = useContext(MainContext).config?.isLlmUserAvatarsEnabled !== false
  const [failed, setFailed] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const frameRef = useRef<View>(null)
  const scrollY = useRef(0)
  const mono = Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  const fontSize = Math.max(12, fontSizes.small)

  useEffect(() => {
    let alive = true
    setText(null)
    setFailed(false)
    if (source != null) {
      setText(source)
      return () => {
        alive = false
      }
    }
    readCachedText(path)
      .then(next => {
        if (alive) {
          setText(next)
        }
      })
      .catch(() => {
        if (alive) {
          setFailed(true)
        }
      })
    return () => {
      alive = false
    }
  }, [path, source])

  const rawMatches = useMemo(() => searchMatchRanges(text || '', query), [text, query])
  const parsedTotal = useMemo(
    () => (ext === 'md' && text ? countMarkdownSearchHits(text, query, avatars) : rawMatches.length),
    [ext, text, query, avatars, rawMatches.length],
  )
  const total = mode === 'raw' ? rawMatches.length : parsedTotal
  const active = mode === 'raw' ? activeRaw : activeParsed
  const shown = total ? Math.min(active, total - 1) : 0

  useEffect(() => {
    setActiveRaw(0)
    setActiveParsed(0)
  }, [query, path])

  useEffect(() => {
    scrollY.current = 0
  }, [mode, text])

  const revealWindowY = (targetTop: number) => {
    const frame = frameRef.current
    const scroll = scrollRef.current
    if (!frame || !scroll) {
      return
    }
    frame.measureInWindow((_x, top) => {
      const y = scrollOffsetForWindowTarget(scrollY.current, top, targetTop, 24)
      scrollY.current = y
      scroll.scrollTo({ y, animated: true })
    })
  }

  const step = (delta: number) => {
    if (!total) {
      return
    }
    const update = (current: number) => Math.min(total - 1, Math.max(0, current + delta))
    if (mode === 'raw') {
      setActiveRaw(update)
    } else {
      setActiveParsed(update)
    }
  }

  useEffect(() => {
    if (mode !== 'raw' || !text || !rawMatches.length) {
      return
    }
    const at = Math.min(activeRaw, rawMatches.length - 1)
    const line = text.slice(0, rawMatches[at][0]).split('\n').length - 1
    scrollRef.current?.scrollTo({ y: Math.max(0, line * Math.round(fontSize * 1.45) - 24), animated: true })
  }, [activeRaw, rawMatches, text, mode, fontSize])

  const body =
    text == null ? (
      failed ? (
        <Text style={{ margin: blocks.medium, fontSize: fontSizes.p }}>{t('file.failed')}</Text>
      ) : (
        <LoaderComponent />
      )
    ) : mode === 'raw' ? (
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        scrollEventThrottle={16}
        onScroll={event => {
          scrollY.current = event.nativeEvent.contentOffset.y
        }}
        contentContainerStyle={{ paddingHorizontal: blocks.small, paddingTop: blocks.small }}>
        <SearchHighlight
          selectable
          text={text}
          query={query}
          activeIndex={Math.min(activeRaw, Math.max(rawMatches.length - 1, 0))}
          style={{ color: colors.text, fontFamily: mono, fontSize, lineHeight: Math.round(fontSize * 1.45) }}
        />
      </ScrollView>
    ) : ext === 'md' ? (
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        scrollEventThrottle={16}
        onScroll={event => {
          scrollY.current = event.nativeEvent.contentOffset.y
        }}
        contentContainerStyle={{ paddingHorizontal: blocks.small, paddingTop: blocks.small }}>
        <MarkdownViewComponent
          content={text}
          alwaysSelectable={inline}
          query={query}
          activeIndex={parsedTotal ? Math.min(activeParsed, parsedTotal - 1) : 0}
          onMatchLayout={revealWindowY}
        />
      </ScrollView>
    ) : (
      <SourceCodeView
        text={text}
        selectable={inline}
        lang={sourceLangFor(ext, true)}
        query={query}
        activeIndex={rawMatches.length ? Math.min(activeParsed, rawMatches.length - 1) : 0}
      />
    )

  const chevron = (nameIcon: string, delta: number, disabled: boolean) => (
    <TouchableRipple
      disabled={disabled}
      onPress={() => step(delta)}
      rippleColor={colors.ripple}
      style={{
        width: 42,
        height: 42,
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      }}>
      <Icon name={nameIcon} size={fontSizes.p} color={colors.text} />
    </TouchableRipple>
  )

  return (
    <View style={{ flex: 1, backgroundColor: inline ? 'transparent' : colors.background }}>
      <LlmSegmentedRow
        value={mode}
        onChange={setMode}
        options={[
          { key: 'parsed', label: t('llm.viewFormatted') },
          { key: 'raw', label: t('llm.viewRaw') },
        ]}
      />
      <SearchFieldComponent
        value={query}
        onChangeText={setQuery}
        placeholder={t('rights.logSearch')}
        style={{ marginBottom: blocks.small }}
        right={
          !!query && (
            <>
              <Text style={{ color: colors.faded, fontSize: fontSizes.small, marginHorizontal: blocks.small }}>
                {total ? `${shown + 1}/${total}` : '0/0'}
              </Text>
              {chevron('chevron-up', -1, shown <= 0 || total === 0)}
              {chevron('chevron-down', 1, total === 0 || shown >= total - 1)}
            </>
          )
        }
      />
      <View ref={frameRef} collapsable={false} style={{ flex: 1 }}>
        {body}
      </View>
    </View>
  )
}
