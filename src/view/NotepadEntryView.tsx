import React, { useCallback, useContext, useLayoutEffect, useState } from 'react'
import { Platform, ScrollView, Text as NativeText, ToastAndroid, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { ActivityIndicator, Text } from 'react-native-paper'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { androidStackBottomInset, FabComponent, StackHeaderComponent } from '../component'
import {
  formatDate,
  MainContext,
  notepadBody,
  notepadCodeKind,
  notepadEditUrl,
  notepadPlainUrl,
  notepadReaderUrl,
  notepadSelected,
  t,
} from '../lib'
import type { NotepadDetail } from '../lib'
import { FileView } from './FileView'

const stamp = (value?: string) => {
  if (!value) {
    return ''
  }
  return value.length >= 11 ? formatDate(value) : value
}

const copyText = (value: string) => {
  Clipboard.setString(value)
  if (Platform.OS === 'android') {
    ToastAndroid.showWithGravity(t('coppied'), ToastAndroid.LONG, ToastAndroid.BOTTOM)
  }
}

export const NotepadEntryView = ({ navigation, route }) => {
  const entryId = route?.params?.entryId
  const context = useContext(MainContext)
  const nyx = context.nyx
  const theme = context.theme
  const [entry, setEntry] = useState<NotepadDetail | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const isFocused = useIsFocused()

  const load = useCallback(async () => {
    if (!nyx || entryId == null) {
      return
    }
    setIsFetching(true)
    try {
      const res = await nyx.api.getNotepadEntry(entryId)
      const selected = notepadSelected(res)
      setEntry(selected)
    } finally {
      setIsFetching(false)
    }
  }, [nyx, entryId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const body = notepadBody(entry)
  const codeKind = notepadCodeKind(body)
  const created = stamp(entry?.inserted_at)
  const updated = stamp(entry?.updated_at)

  useLayoutEffect(() => {
    if (!theme?.colors) {
      return
    }
    const lines = [
      created ? `${t('notepad.created')} ${created}` : '',
      updated ? `${t('notepad.updated')} ${updated}` : '',
      entry?.public ? t('notepad.public') : '',
    ].filter(Boolean)
    navigation.setOptions({
      title: entry?.title || t('notepad.title'),
      header: (props: any) => (
        <StackHeaderComponent
          {...props}
          theme={theme}
          rightMaxWidth="68%"
          right={
            lines.length ? (
              <View>
                {lines.map(line => (
                  <NativeText
                    key={line}
                    numberOfLines={1}
                    style={{
                      color: theme.colors.disabled,
                      fontSize: theme.metrics.fontSizes.small,
                      lineHeight: Math.round(theme.metrics.fontSizes.small * 1.3),
                      textAlign: 'right',
                    }}>
                    {line}
                  </NativeText>
                ))}
              </View>
            ) : undefined
          }
        />
      ),
    })
  }, [navigation, theme, entry, created, updated])

  if (!theme?.colors) {
    return null
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {isFetching && !entry && <ActivityIndicator color={theme.colors.primary} style={{ margin: 24 }} />}
      {!!entry && (
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: codeKind ? 0 : theme.metrics.blocks.medium,
            paddingTop: codeKind ? 0 : theme.metrics.blocks.medium,
          }}>
          {codeKind ? (
            <FileView inline source={body} name={`note.${codeKind}`} />
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 88 }}>
              <Text selectable style={{ color: theme.colors.text, fontSize: theme.metrics.fontSizes.p }}>
                {body}
              </Text>
            </ScrollView>
          )}
        </View>
      )}
      {!isFetching && !entry && (
        <Text style={{ color: theme.colors.disabled, margin: theme.metrics.blocks.medium }}>{t('empty')}</Text>
      )}
      <FabComponent
        isVisible={isFocused && !!entry}
        iconOpen={'pencil'}
        iconClosed={'pencil'}
        paddingBottom={androidStackBottomInset}
        backgroundColor={theme.colors.primary}
        onPress={isOpen => {
          if (isOpen && entry) {
            navigation.push('notepadEdit', { url: notepadEditUrl(entry.id) })
          }
        }}
        actions={
          entry
            ? [
                {
                  icon: 'content-copy',
                  label: t('notepad.copy'),
                  style: { backgroundColor: theme.colors.primary },
                  onPress: () => copyText(body),
                },
                {
                  icon: 'link-variant',
                  label: t('notepad.sharePlain'),
                  style: { backgroundColor: theme.colors.primary },
                  onPress: () => copyText(notepadPlainUrl(entry.id)),
                },
                {
                  icon: 'book-open-variant',
                  label: t('notepad.shareReader'),
                  style: { backgroundColor: theme.colors.primary },
                  onPress: () => copyText(notepadReaderUrl(entry.id)),
                },
              ]
            : []
        }
      />
    </View>
  )
}
