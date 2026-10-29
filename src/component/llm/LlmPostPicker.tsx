import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { BackHandler, NativeScrollEvent, NativeSyntheticEvent, SectionList, View } from 'react-native'
import { IconButton, Text } from 'react-native-paper'
import {
  buildSectionListLayoutMap,
  calculatePopulatedCount,
  groupPostsByDay,
  indexPostsByKey,
  LlmRangeSelection,
  pressLlmRange,
  toggleLlmRangePost,
  useTheme,
} from '../../lib'
import { formatLlmDate } from './llmFormat'
import { LlmPostPreview } from './LlmPostPreview'
import { PostPickRow, ROW_HEIGHT } from './PostPickRow'

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

const HEADER_HEIGHT = 28
const INITIAL_POPULATED_COUNT = 100
const INITIAL_NUM_TO_RENDER = 40
const MAX_TO_RENDER_PER_BATCH = 30
const WINDOW_SIZE = 11

export const LlmPostPicker: React.FC<Props> = props => {
  const { discussionId, posts, selection, onChange, onBack, onConfirm, onOpenPost, onOpenImages } = props
  const { colors, metrics: { blocks, fontSizes } } = useTheme()
  const picked = useMemo(() => new Set(selection.picked), [selection.picked])
  const [preview, setPreview] = useState<{ discussionId: number | string; postId: string; initialPost?: any } | null>(null)
  const [populatedCount, setPopulatedCount] = useState(INITIAL_POPULATED_COUNT)

  const byKey = useMemo(() => indexPostsByKey(posts), [posts])
  const sections = useMemo(() => groupPostsByDay(selection.order, byKey, formatLlmDate), [byKey, selection.order])
  const layoutMap = useMemo(() => buildSectionListLayoutMap(sections, HEADER_HEIGHT, ROW_HEIGHT), [sections])

  const getItemLayout = useCallback(
    (_data: any, index: number) => layoutMap[index] || { length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index },
    [layoutMap],
  )

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent
    setPopulatedCount(prev => calculatePopulatedCount(contentOffset.y, layoutMeasurement.height, prev, ROW_HEIGHT))
  }, [])

  const extraData = useMemo(() => ({ picked: selection.picked, populatedCount }), [selection.picked, populatedCount])

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
          {`${selection.picked.length} / ${selection.order.length}`}
        </Text>
        <IconButton icon="check" size={25} color={colors.primary} rippleColor={colors.ripple} onPress={onConfirm} />
      </View>
      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={item => item.key}
        stickySectionHeadersEnabled
        extraData={extraData}
        getItemLayout={getItemLayout}
        initialNumToRender={INITIAL_NUM_TO_RENDER}
        maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
        windowSize={WINDOW_SIZE}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        renderSectionHeader={({ section }) => (
          <View style={{ height: HEADER_HEIGHT, justifyContent: 'center', backgroundColor: colors.background, paddingHorizontal: blocks.medium }}>
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
            emptyShell={item.index >= populatedCount}
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
