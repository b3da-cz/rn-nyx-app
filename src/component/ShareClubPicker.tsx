import React, { FC, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Nyx, ShareClub, Theme, parseShareDiscussions, t } from '../lib'

type Props = { nyx: Nyx; theme?: Theme; onSelectClub: (club: ShareClub) => void }

export const ShareClubPicker: FC<Props> = ({ nyx, theme, onSelectClub }) => {
  const [searchPhrase, setSearchPhrase] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<ShareClub[]>([])
  const [history, setHistory] = useState<ShareClub[]>([])
  const colors = theme?.colors || ({} as any)
  const fontSizes = theme?.metrics?.fontSizes || { p: 14, small: 12 }

  useEffect(() => {
    let isMounted = true
    nyx?.api?.getHistory?.(true)
      .then((res: any) => {
        if (isMounted && res?.discussions) setHistory(parseShareDiscussions(res.discussions).slice(0, 5))
      })
      .catch(() => null)
    return () => { isMounted = false }
  }, [nyx])

  const handleSearch = async (text: string) => {
    setSearchPhrase(text)
    const trimmed = text.trim()
    if (trimmed.length >= 3 && nyx?.api) {
      setIsSearching(true)
      try {
        const res: any = await nyx.api.search(trimmed, true)
        setSearchResults(parseShareDiscussions(res?.discussion?.discussions || []))
      } catch (_) {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    } else {
      setSearchResults([])
    }
  }

  const renderSectionHeader = (title: string) => (
    <View style={{ backgroundColor: colors.tertiary || '#4a0e0e', height: 26, justifyContent: 'center', paddingHorizontal: 8, marginBottom: 2 }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</Text>
    </View>
  )

  const renderItem = (item: ShareClub, prefix: string) => {
    const isUnread = (item.unreadCount ?? 0) > 0
    const textColor = isUnread ? colors.text : colors.disabled
    const borderColor = isUnread ? (colors.primary || '#d32f2f') : (colors.row || '#1a1b1d')
    return (
      <TouchableRipple
        key={`${prefix}_${item.id}`}
        onPress={() => onSelectClub(item)}
        style={{
          backgroundColor: colors.row || '#1a1b1d',
          borderLeftWidth: 3,
          borderLeftColor: borderColor,
          paddingVertical: 9,
          paddingHorizontal: 10,
          marginBottom: 2,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text numberOfLines={1} style={{ flex: 1, color: textColor, fontSize: fontSizes.p }}>{item.name}</Text>
          {isUnread && <Text style={{ color: textColor, fontSize: fontSizes.small, marginLeft: 8 }}>{String(item.unreadCount)}</Text>}
        </View>
      </TouchableRipple>
    )
  }

  const filteredHistory = searchPhrase.trim().length > 0 && searchResults.length === 0
    ? history.filter(h => h.name.toLowerCase().includes(searchPhrase.trim().toLowerCase()))
    : history

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background || '#161719',
          borderBottomWidth: 2,
          borderBottomColor: isFocused ? (colors.primary || '#d32f2f') : 'transparent',
          paddingHorizontal: 8,
          // marginBottom: 8,
        }}>
        <Icon name="search" size={15} color={isFocused ? (colors.primary || '#d32f2f') : colors.disabled} />
        <TextInput
          value={searchPhrase}
          onChangeText={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t('share.searchClub') || 'Hledat klub...'}
          placeholderTextColor={colors.disabled}
          selectionColor={colors.primary}
          style={{ flex: 1, height: 38, color: colors.text, paddingHorizontal: 8, fontSize: fontSizes.p }}
        />
        {searchPhrase.length > 0 && (
          <TouchableRipple onPress={() => handleSearch('')} style={{ padding: 4 }}>
            <Icon name="x" size={15} color={colors.disabled} />
          </TouchableRipple>
        )}
      </View>
      <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ marginTop: 3 }} keyboardShouldPersistTaps="handled">
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
        ) : searchPhrase.trim().length >= 3 ? (
          searchResults.length > 0 ? (
            <>{renderSectionHeader(t('share.searchResults') || 'Výsledky hledání')}{searchResults.map(c => renderItem(c, 's'))}</>
          ) : (
            <Text style={{ color: colors.disabled, textAlign: 'center', marginVertical: 20 }}>{t('share.noClubs') || 'Žádné kluby nenalezeny'}</Text>
          )
        ) : searchPhrase.trim().length > 0 ? (
          filteredHistory.length > 0 ? (
            <>{renderSectionHeader(t('share.recentClubs') || 'Poslední navštívené')}{filteredHistory.map(c => renderItem(c, 'fh'))}</>
          ) : (
            <Text style={{ color: colors.disabled, textAlign: 'center', marginVertical: 20 }}>{t('share.noClubs') || 'Žádné kluby nenalezeny'}</Text>
          )
        ) : history.length > 0 ? (
          <View>{renderSectionHeader(t('share.recentClubs') || 'Poslední navštívené')}{history.map(c => renderItem(c, 'h'))}</View>
        ) : null}
      </ScrollView>
    </View>
  )
}
