import React, { useCallback, useContext, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { ActivityIndicator, FAB, Portal, Text } from 'react-native-paper'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { androidStackBottomInset, SafeBottom } from '../component'
import { formatDate, MainContext, notepadBody, notepadEditUrl, notepadSelected, t } from '../lib'
import type { NotepadDetail } from '../lib'

const when = (entry?: NotepadDetail | null) => {
  const value = entry?.updated_at || entry?.inserted_at || ''
  if (value.length < 11) {
    return ''
  }
  return formatDate(value)
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

  const meta = [when(entry), entry?.public ? t('notepad.public') : ''].filter(Boolean).join('  ')

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
            {!!meta && (
              <Text style={{ color: theme.colors.disabled, fontSize: theme.metrics.fontSizes.small, marginTop: 2 }}>
                {meta}
              </Text>
            )}
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              margin: 4,
              padding: 4,
            }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 88 }}>
              <Text selectable style={{ color: theme.colors.text, fontSize: theme.metrics.fontSizes.p }}>
                {notepadBody(entry)}
              </Text>
            </ScrollView>
          </View>
        </>
      )}
      {!isFetching && !entry && (
        <Text style={{ color: theme.colors.disabled, margin: theme.metrics.blocks.medium }}>{t('empty')}</Text>
      )}
      <SafeBottom min={androidStackBottomInset}>
        {insetBottom => (
          <Portal>
            <FAB
              style={{
                position: 'absolute',
                right: 16,
                bottom: insetBottom,
                backgroundColor: theme.colors.primary,
              }}
              icon={'pencil'}
              visible={isFocused && !!entry}
              onPress={() => entry && navigation.push('notepadEdit', { url: notepadEditUrl(entry.id) })}
            />
          </Portal>
        )}
      </SafeBottom>
    </View>
  )
}
