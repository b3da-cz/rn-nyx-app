import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, NativeSyntheticEvent, Pressable, SectionList, TextLayoutEventData, View } from 'react-native'
import { IconButton, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import {
  llmPostClock,
  llmPostDay,
  llmPostExcerpt,
  llmPostKey,
  LlmRangeSelection,
  pressLlmRange,
  toggleLlmRangePost,
  useTheme,
} from '../../lib'
import { UserIconComponent } from '../UserIconComponent'
import { formatLlmDate } from './llmFormat'
import { LlmPostPreview } from './LlmPostPreview'

type Row = { key: string; index: number }

type Props = {
  discussionId: number | string
  posts: any[]
  selection: LlmRangeSelection
  onChange: (selection: LlmRangeSelection) => void
  onBack: () => void
  onConfirm: () => void
  onOpenPost: (discussionId: number | string, postId?: number | string) => void
  onOpenImages: (images: any[], imgIndex: number) => void
}

const ROW_HEIGHT = 32
const ICON_W = 18
const ICON_H = 22

const textReachesEnd = (excerpt: string, shown: string, lineWidth: number, boxWidth: number) => {
  if (!excerpt) {
    return false
  }
  const visible = shown.replace(/\u2026$/, '').replace(/\.\.\.$/, '')
  const clipped = shown !== excerpt && visible !== excerpt
  const filled = boxWidth > 0 && lineWidth >= boxWidth - 1
  return clipped || filled
}

const PostPickRow = ({
  post,
  selected,
  discussionId,
  postKey,
  colors,
  blocks,
  fontSizes,
  onPreview,
  onRange,
  onToggle,
}: {
  post: any
  selected: boolean
  discussionId: number | string
  postKey: string
  colors: { primary: string; background: string; border: string; text: string; faded: string; ripple: string }
  blocks: { medium: number; small: number }
  fontSizes: { small: number; p: number }
  onPreview: (target: { discussionId: number | string; postId: string; initialPost?: any }) => void
  onRange: () => void
  onToggle: () => void
}) => {
  const excerpt = llmPostExcerpt(post)
  const clock = llmPostClock(post)
  const username = post?.username || '—'
  const boxWidth = useRef(0)
  const lineRef = useRef<{ text: string; width: number } | null>(null)
  const [pipeBeforeTime, setPipeBeforeTime] = useState(false)
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

export const LlmPostPicker: React.FC<Props> = ({
  discussionId,
  posts,
  selection,
  onChange,
  onBack,
  onConfirm,
  onOpenPost,
  onOpenImages,
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const picked = useMemo(() => new Set(selection.picked), [selection.picked])
  const [preview, setPreview] = useState<{
    discussionId: number | string
    postId: string
    initialPost?: any
  } | null>(null)
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
      if (preview) {
        setPreview(null)
        return true
      }
      onBack()
      return true
    })
    return () => sub.remove()
  }, [onBack, preview])

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
        renderItem={({ item }) => (
          <PostPickRow
            post={byKey.get(item.key)}
            selected={picked.has(item.key)}
            discussionId={discussionId}
            postKey={item.key}
            colors={colors}
            blocks={blocks}
            fontSizes={fontSizes}
            onPreview={setPreview}
            onRange={() => onChange(pressLlmRange(selection, item.index))}
            onToggle={() => onChange(toggleLlmRangePost(selection, item.index))}
          />
        )}
      />
      {!!preview && (
        <LlmPostPreview
          key={`${preview.discussionId}-${preview.postId}`}
          discussionId={preview.discussionId}
          postId={preview.postId}
          initialPost={preview.initialPost || byKey.get(preview.postId)}
          onClose={() => setPreview(null)}
          onShowReplies={(nextDiscussionId, nextPostId) =>
            setPreview({
              discussionId: nextDiscussionId,
              postId: `${nextPostId}`,
              initialPost: byKey.get(String(nextPostId)),
            })
          }
          onOpenPost={onOpenPost}
          onOpenImages={onOpenImages}
        />
      )}
    </View>
  )
}
