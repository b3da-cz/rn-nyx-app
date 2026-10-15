import React, { useCallback, useContext, useState } from 'react'
import { Platform, ScrollView, ToastAndroid, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { ActivityIndicator, Text } from 'react-native-paper'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { androidStackBottomInset, FabComponent } from '../component'
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
      navigation.setOptions({ title: selected?.title || t('notepad.title') })
    } finally {
      setIsFetching(false)
    }
  }, [nyx, entryId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  if (!theme?.colors) {
    return null
  }

  const body = notepadBody(entry)
  const codeKind = notepadCodeKind(body)
  const created = stamp(entry?.inserted_at)
  const updated = stamp(entry?.updated_at)
  const meta = [
    created ? `${t('notepad.created')} ${created}` : '',
    updated ? `${t('notepad.updated')} ${updated}` : '',
    entry?.public ? t('notepad.public') : '',
  ].filter(Boolean)

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {isFetching && !entry && <ActivityIndicator color={theme.colors.primary} style={{ margin: 24 }} />}
      {!!entry && (
        <>
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderLeftWidth: 3,
              borderLeftColor: theme.colors.primary,
              paddingLeft: theme.metrics.blocks.small,
              paddingRight: theme.metrics.blocks.medium,
              paddingVertical: theme.metrics.blocks.small,
              minHeight: theme.metrics.blocks.rowDiscussion,
              justifyContent: 'center',
            }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.metrics.fontSizes.p }}>{entry.title}</Text>
            {meta.map(line => (
              <Text
                key={line}
                style={{ color: theme.colors.disabled, fontSize: theme.metrics.fontSizes.small, marginTop: 2 }}>
                {line}
              </Text>
            ))}
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              margin: 4,
              padding: codeKind ? 0 : 4,
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
        </>
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
