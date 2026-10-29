import React, { useRef, useState } from 'react'
import { NativeSyntheticEvent, Pressable, TextLayoutEventData, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { llmPostClock, llmPostExcerpt, textReachesEnd } from '../../lib'
import { UserIconComponent } from '../UserIconComponent'

export const ROW_HEIGHT = 32
const ICON_W = 18
const ICON_H = 22

type Props = {
  post: any
  selected: boolean
  discussionId: number | string
  postKey: string
  colors: { primary: string; background: string; border: string; text: string; faded: string; ripple: string }
  blocks: { medium: number; small: number }
  fontSizes: { small: number; p: number }
  emptyShell?: boolean
  onPreview: (target: { discussionId: number | string; postId: string; initialPost?: any }) => void
  onRange: () => void
  onToggle: () => void
}

export const PostPickRow: React.FC<Props> = ({
  post,
  selected,
  discussionId,
  postKey,
  colors,
  blocks,
  fontSizes,
  emptyShell,
  onPreview,
  onRange,
  onToggle,
}) => {
  const boxWidth = useRef(0)
  const lineRef = useRef<{ text: string; width: number } | null>(null)
  const [pipeBeforeTime, setPipeBeforeTime] = useState(false)

  if (emptyShell) {
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
        <Pressable style={{ flex: 1, height: ROW_HEIGHT }} onPress={onRange}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: blocks.medium, height: ROW_HEIGHT }}>
            <View style={{ width: ICON_W, height: ICON_H, marginRight: 8 }} />
            <Text numberOfLines={1} style={{ flexShrink: 1, color: colors.faded, fontSize: fontSizes.small }}>
              {'…'}
            </Text>
          </View>
        </Pressable>
        <Pressable
          style={{ width: 36, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
          hitSlop={4}
          onPress={onToggle}>
          <Icon name={selected ? 'check-square' : 'square'} size={fontSizes.p} color={colors.text} />
        </Pressable>
      </View>
    )
  }

  const excerpt = llmPostExcerpt(post)
  const clock = llmPostClock(post)
  const username = post?.username || '—'

  const syncPipe = (box: number, line: { text: string; width: number } | null) => {
    const next = line ? textReachesEnd(excerpt, line.text, line.width, box) : false
    setPipeBeforeTime(prev => (prev === next ? prev : next))
  }

  const onExcerptLayout = (width: number) => {
    boxWidth.current = width
    syncPipe(width, lineRef.current)
  }

  const onExcerptText = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const line = event.nativeEvent.lines?.[0]
    lineRef.current = line ? { text: line.text || '', width: line.width || 0 } : null
    syncPipe(boxWidth.current, lineRef.current)
  }

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
        style={{ flexShrink: 1, maxWidth: '55%', height: ROW_HEIGHT, justifyContent: 'center' }}
        rippleColor={colors.ripple}
        onPress={() => onPreview({ discussionId: post?.discussion_id || discussionId, postId: postKey, initialPost: post })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: blocks.medium }}>
          {post?.username ? (
            <UserIconComponent username={post.username} width={ICON_W} height={ICON_H} marginRight={8} />
          ) : (
            <View style={{ width: ICON_W, height: ICON_H, marginRight: 8 }} />
          )}
          <Text numberOfLines={1} style={{ flexShrink: 1, color: colors.text, fontSize: fontSizes.small }}>
            {username}
          </Text>
        </View>
      </TouchableRipple>
      {!!excerpt && (
        <Text style={{ color: selected ? colors.text : colors.faded, fontSize: fontSizes.small }}>{' | '}</Text>
      )}
      <TouchableRipple
        style={{ flex: 1, minWidth: 0, height: ROW_HEIGHT, justifyContent: 'center' }}
        rippleColor={colors.ripple}
        onPress={onRange}>
        <View onLayout={event => onExcerptLayout(event.nativeEvent.layout.width)}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            onTextLayout={onExcerptText}
            style={{ color: selected ? colors.text : colors.faded, fontSize: fontSizes.small }}>
            {excerpt}
          </Text>
        </View>
      </TouchableRipple>
      <TouchableRipple style={{ flexShrink: 0, height: ROW_HEIGHT, justifyContent: 'center' }} rippleColor={colors.ripple} onPress={onRange}>
        <Text style={{ color: selected ? colors.text : colors.faded, fontSize: fontSizes.small, marginRight: blocks.small }}>
          {`${pipeBeforeTime ? ' | ' : ''}${clock}`}
        </Text>
      </TouchableRipple>
      <Pressable
        style={{ width: 36, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
        hitSlop={4}
        onPress={onToggle}>
        <Icon name={selected ? 'check-square' : 'square'} size={fontSizes.p} color={colors.text} />
      </Pressable>
    </View>
  )
}
