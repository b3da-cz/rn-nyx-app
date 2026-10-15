import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { FAB, Portal, Text, TouchableRipple } from 'react-native-paper'
import { WebView } from 'react-native-webview'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { androidStackBottomInset, SafeBottom, SectionHeaderComponent } from '../component'
import {
  formatDate,
  isAppDeveloper,
  MainContext,
  Styling,
  NOTEPAD_CREATE_URL,
  NOTEPAD_LIST_EXTRACT_SCRIPT,
  NOTEPAD_LIST_URL,
  notepadEntries,
  notepadEntriesFromHtml,
  notepadEntriesFromWebMessage,
  sortedNotepadEntries,
  t,
} from '../lib'
import type { NotepadListEntry } from '../lib'

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
  return formatDate(value)
}

export const NotepadView = ({ navigation }) => {
  const context = useContext(MainContext)
  const nyx = context.nyx
  const theme = context.theme
  const showDeveloperUi = isAppDeveloper(nyx?.username || nyx?.api.getAuth()?.username)
  const isFocused = useIsFocused()
  const [entries, setEntries] = useState<NotepadListEntry[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [source, setSource] = useState<NotepadSource>('')
  const [useWebList, setUseWebList] = useState(false)
  const [webHeaders, setWebHeaders] = useState<Record<string, string>>()
  const apiError = useRef('')
  const webDone = useRef(false)

  const applyEntries = useCallback((next: NotepadListEntry[], error = '', from: NotepadSource = '') => {
    setEntries(sortedNotepadEntries(next))
    setLoadError(next.length ? '' : error)
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
        applyEntries(next, '', 'cookies')
        return
      }
      if (data.done && !webDone.current) {
        webDone.current = true
        applyEntries([], apiError.current, 'cookies')
      }
    },
    [applyEntries],
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
      let next = notepadEntries(res)
      let from: NotepadSource = next.length ? 'api' : ''
      if (!next.length && typeof res?._html === 'string') {
        next = notepadEntriesFromHtml(res._html)
        if (next.length) {
          from = 'html'
        }
      }
      if (!next.length) {
        const html = await nyx.api.getNotepadPage()
        next = notepadEntriesFromHtml(html)
        if (next.length) {
          from = 'html'
        }
      }
      if (next.length) {
        applyEntries(next, '', from)
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
      applyEntries([], e?.message || t('error'), 'api')
    }
  }, [applyEntries, nyx])

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
        applyEntries([], apiError.current, 'cookies')
      }
    }, 8000)
    return () => clearTimeout(timer)
  }, [applyEntries, useWebList])

  if (!theme?.colors) {
    return null
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 88 }}
        data={entries}
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
        renderItem={({ item }) => (
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
            }}>
            <View style={[Styling.groups.flexRowSpbCentered, { minHeight: theme.metrics.blocks.rowDiscussion }]}>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  marginRight: theme.metrics.blocks.small,
                  fontSize: theme.metrics.fontSizes.p - 1,
                  color: theme.colors.text,
                }}>
                {item.title || `#${item.id}`}
              </Text>
              {!!when(item) && (
                <Text numberOfLines={1} style={{ color: theme.colors.disabled, fontSize: theme.metrics.fontSizes.small }}>
                  {when(item)}
                </Text>
              )}
            </View>
          </TouchableRipple>
        )}
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
