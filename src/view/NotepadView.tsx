import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { RefreshControl, SectionList, View } from 'react-native'
import { FAB, Portal, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { WebView } from 'react-native-webview'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { androidStackBottomInset, SafeBottom, SearchFieldComponent, SectionHeaderComponent } from '../component'
import {
  foldSearch,
  formatDate,
  isAppDeveloper,
  MainContext,
  Styling,
  NOTEPAD_CREATE_URL,
  NOTEPAD_LIST_EXTRACT_SCRIPT,
  NOTEPAD_LIST_URL,
  notepadEntriesFromHtml,
  notepadEntriesFromWebMessage,
  notepadSections,
  t,
} from '../lib'
import type { NotepadListEntry, NotepadSection } from '../lib'

type NotepadSource = '' | 'api' | 'html' | 'cookies'

const SOURCE_LABEL: Record<Exclude<NotepadSource, ''>, string> = {
  api: 'z api',
  html: 'z html s bearer',
  cookies: 's cookies',
}

const when = (entry: NotepadListEntry) => {
  const value = entry.updated_at || entry.inserted_at || ''
  if (value.length < 11) {
    return ''
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatDate(value).replace('  T', '  ')
  }
  return value
}

export const NotepadView = ({ navigation }) => {
  const context = useContext(MainContext)
  const nyx = context.nyx
  const theme = context.theme
  const showDeveloperUi = isAppDeveloper(nyx?.username || nyx?.api.getAuth()?.username)
  const isFocused = useIsFocused()
  const [sections, setSections] = useState<NotepadSection[]>([])
  const [query, setQuery] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [source, setSource] = useState<NotepadSource>('')
  const [useWebList, setUseWebList] = useState(false)
  const [webHeaders, setWebHeaders] = useState<Record<string, string>>()
  const apiError = useRef('')
  const webDone = useRef(false)

  const applySections = useCallback((next: NotepadSection[], error = '', from: NotepadSource = '') => {
    const count = next.reduce((sum, section) => sum + section.entries.length, 0)
    setSections(next)
    setLoadError(count ? '' : error)
    setSource(from)
    setIsFetching(false)
    setUseWebList(false)
  }, [])

  const onWebMessage = useCallback(
    (raw?: string) => {
      let data: { done?: boolean } = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        data = {}
      }
      const next = notepadEntriesFromWebMessage(raw)
      if (next.length) {
        webDone.current = true
        applySections(notepadSections({ entries: next }), '', 'cookies')
        return
      }
      if (data.done && !webDone.current) {
        webDone.current = true
        applySections([], apiError.current, 'cookies')
      }
    },
    [applySections],
  )

  const load = useCallback(async () => {
    if (!nyx) {
      return
    }
    setIsFetching(true)
    setLoadError('')
    setSource('')
    setUseWebList(false)
    webDone.current = false
    apiError.current = ''
    try {
      const res = await nyx.api.getNotepadPayload()
      const count = (list: NotepadSection[]) => list.reduce((sum, section) => sum + section.entries.length, 0)
      let next = notepadSections(res)
      let from: NotepadSource = count(next) ? 'api' : ''
      if (!count(next) && typeof res?._html === 'string') {
        next = notepadSections({ entries: notepadEntriesFromHtml(res._html) })
        if (count(next)) {
          from = 'html'
        }
      }
      if (!count(next)) {
        const html = await nyx.api.getNotepadPage()
        next = notepadSections({ entries: notepadEntriesFromHtml(html) })
        if (count(next)) {
          from = 'html'
        }
      }
      if (count(next)) {
        applySections(next, '', from)
        return
      }
      console.warn(
        '[notepad] api list empty',
        res && typeof res === 'object' ? Object.keys(res).join(',') : typeof res,
        Array.isArray(res?.entries) ? res.entries.length : 'entries-missing',
        res?.error || '',
      )
      apiError.current = res?.error ? String(res.error) : ''
      setWebHeaders(nyx.api.notepadPageHeaders())
      setUseWebList(true)
    } catch (e: any) {
      applySections([], e?.message || t('error'), 'api')
    }
  }, [applySections, nyx])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  useEffect(() => {
    if (!useWebList) {
      return
    }
    const timer = setTimeout(() => {
      if (!webDone.current) {
        webDone.current = true
        applySections([], apiError.current, 'cookies')
      }
    }, 8000)
    return () => clearTimeout(timer)
  }, [applySections, useWebList])

  if (!theme?.colors) {
    return null
  }

  const needle = foldSearch(query.trim())
  const visible = needle
    ? sections
        .map(section => ({
          ...section,
          entries: section.entries.filter(entry => foldSearch(entry.title || `#${entry.id}`).includes(needle)),
        }))
        .filter(section => section.entries.length > 0)
    : sections

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SearchFieldComponent value={query} onChangeText={setQuery} placeholder={t('notepad.search')} />
      <SectionList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 88 }}
        sections={visible.map(section => ({
          id: section.id,
          title: section.title || t('notepad.uncategorized'),
          data: section.entries,
        }))}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled
        keyExtractor={item => `${item.id}`}
        refreshing={isFetching}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={load} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          isFetching ? null : (
            <SectionHeaderComponent title={loadError || t('empty')} backgroundColor={theme.colors.surface} />
          )
        }
        renderSectionHeader={({ section }) => <SectionHeaderComponent title={section.title} />}
        renderItem={({ item }) => {
          const isPublic = item.public === true
          const isPrivate = item.public === false
          return (
          <TouchableRipple
            rippleColor={theme.colors.ripple}
            onPress={() => navigation.push('notepadEntry', { entryId: item.id })}
            style={{
              backgroundColor: theme.colors.row,
              paddingLeft: theme.metrics.blocks.small,
              paddingRight: theme.metrics.blocks.medium,
              marginBottom: theme.metrics.blocks.small,
              borderColor: theme.colors.row,
              borderLeftWidth: 3,
              borderLeftColor: isPublic ? theme.colors.primary : theme.colors.row,
            }}>
            <View style={[Styling.groups.flexRowSpbCentered, { minHeight: theme.metrics.blocks.rowDiscussion }]}>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  marginRight: theme.metrics.blocks.small,
                  fontSize: theme.metrics.fontSizes.p - 1,
                  color: theme.colors.text,
                  opacity: isPrivate ? 0.9 : 1,
                }}>
                {item.title || `#${item.id}`}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {!!when(item) && (
                  <Text numberOfLines={1} style={{ color: theme.colors.disabled, fontSize: theme.metrics.fontSizes.small }}>
                    {when(item)}
                  </Text>
                )}
                {isPrivate && (
                  <Icon
                    name="lock"
                    size={theme.metrics.fontSizes.p}
                    color={theme.colors.text}
                    style={{ marginLeft: theme.metrics.blocks.small, opacity: 0.9 }}
                  />
                )}
              </View>
            </View>
          </TouchableRipple>
          )
        }}
      />
      <SafeBottom min={androidStackBottomInset}>
        {insetBottom => (
          <>
            {source && showDeveloperUi ? (
              <View
                style={{
                  paddingHorizontal: theme.metrics.blocks.medium,
                  paddingTop: theme.metrics.blocks.small,
                  paddingBottom: theme.metrics.blocks.small + insetBottom,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.surface,
                }}>
                <Text style={{ color: theme.colors.disabled, fontSize: theme.metrics.fontSizes.small }}>
                  {SOURCE_LABEL[source]}
                </Text>
              </View>
            ) : null}
            <Portal>
              <FAB
                style={{
                  position: 'absolute',
                  right: 16,
                  bottom: insetBottom + (source && showDeveloperUi ? 36 : 0),
                  backgroundColor: theme.colors.primary,
                }}
                icon={'plus'}
                visible={isFocused}
                onPress={() => navigation.push('notepadEdit', { url: NOTEPAD_CREATE_URL })}
              />
            </Portal>
          </>
        )}
      </SafeBottom>
      {useWebList ? (
        <WebView
          source={{ uri: NOTEPAD_LIST_URL, headers: webHeaders }}
          style={{ position: 'absolute', left: -2000, width: 320, height: 480, opacity: 0 }}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          injectedJavaScript={NOTEPAD_LIST_EXTRACT_SCRIPT}
          onMessage={event => onWebMessage(event.nativeEvent.data)}
        />
      ) : null}
    </View>
  )
}
