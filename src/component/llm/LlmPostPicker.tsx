import React, { useEffect, useMemo } from 'react'
import { BackHandler, SectionList, View } from 'react-native'
import { IconButton, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import {
  llmPostClock,
  llmPostDay,
  llmPostKey,
  LlmRangeSelection,
  pressLlmRange,
  toggleLlmRangePost,
  useTheme,
} from '../../lib'
import { UserIconComponent } from '../UserIconComponent'
import { formatLlmDate } from './llmFormat'

type Row = { key: string; index: number }

type Props = {
  posts: any[]
  selection: LlmRangeSelection
  onChange: (selection: LlmRangeSelection) => void
  onBack: () => void
  onConfirm: () => void
}

const ROW_HEIGHT = 32
const ICON_W = 18
const ICON_H = 22

export const LlmPostPicker: React.FC<Props> = ({ posts, selection, onChange, onBack, onConfirm }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const picked = useMemo(() => new Set(selection.picked), [selection.picked])
  const byKey = useMemo(() => {
    const map = new Map<string, any>()
    posts.forEach(post => {
      const key = llmPostKey(post)
      if (key && !map.has(key)) {
        map.set(key, post)
      }
    })
    return map
  }, [posts])
  const sections = useMemo(() => {
    const groups: { key: string; day: string; title: string; data: Row[] }[] = []
    selection.order.forEach((key, index) => {
      const post = byKey.get(key)
      if (!post) {
        return
      }
      const day = llmPostDay(post)
      const title = day ? formatLlmDate(day) : '…'
      const row = { key, index }
      const last = groups[groups.length - 1]
      if (last && last.day === day) {
        last.data.push(row)
      } else {
        groups.push({ key: `${day}:${key}`, day, title, data: [row] })
      }
    })
    return groups
  }, [byKey, selection.order])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack()
      return true
    })
    return () => sub.remove()
  }, [onBack])

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 50 }}>
        <IconButton icon="arrow-left" size={25} color={colors.primary} rippleColor={colors.ripple} onPress={onBack} />
        <Text style={{ flex: 1, textAlign: 'center', fontSize: fontSizes.p + 2, color: colors.text }}>
          {`${selection.order.length} / ${selection.picked.length}`}
        </Text>
        <IconButton icon="check" size={25} color={colors.primary} rippleColor={colors.ripple} onPress={onConfirm} />
      </View>
      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={item => item.key}
        stickySectionHeadersEnabled
        extraData={selection.picked}
        renderSectionHeader={({ section }) => (
          <View style={{ backgroundColor: colors.background, paddingHorizontal: blocks.medium, paddingVertical: blocks.small }}>
            <Text style={{ color: colors.faded, fontSize: fontSizes.small }}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const post = byKey.get(item.key)
          const selected = picked.has(item.key)
          const username = post?.username || '—'
          return (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: ROW_HEIGHT,
                backgroundColor: selected ? colors.primary : colors.background,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}>
              <TouchableRipple
                style={{ flex: 1, height: ROW_HEIGHT, justifyContent: 'center' }}
                rippleColor={colors.ripple}
                onPress={() => onChange(pressLlmRange(selection, item.index))}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: blocks.medium }}>
                  {post?.username ? (
                    <UserIconComponent username={post.username} width={ICON_W} height={ICON_H} marginRight={8} />
                  ) : (
                    <View style={{ width: ICON_W, height: ICON_H, marginRight: 8 }} />
                  )}
                  <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: fontSizes.small }}>
                    {username}
                  </Text>
                  <Text style={{ color: selected ? colors.text : colors.faded, fontSize: fontSizes.small, marginRight: blocks.small }}>
                    {llmPostClock(post)}
                  </Text>
                </View>
              </TouchableRipple>
              <TouchableRipple
                style={{ width: 36, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
                rippleColor={colors.ripple}
                onPress={() => {
                  const inside = item.index >= selection.start && item.index <= selection.end
                  onChange(inside ? toggleLlmRangePost(selection, item.index) : pressLlmRange(selection, item.index))
                }}>
                <Icon name={selected ? 'check-square' : 'square'} size={fontSizes.p} color={colors.text} />
              </TouchableRipple>
            </View>
          )
        }}
      />
    </View>
  )
}
