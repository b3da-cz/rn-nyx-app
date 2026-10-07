import React, { useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { androidStackBottomInset } from '../component'
import { DiscussionView } from '../view'

export const Discussion = ({ navigation, route }) => {
  const viewRef = useRef<DiscussionView>(null)
  const insets = useSafeAreaInsets()
  const bottomInset = Math.max(insets.bottom, androidStackBottomInset)
  const { discussionId, postId, showBoard, showHeader, showReplies, showStats, jumpToLastSeen, lastSeenPostId } =
    route.params
  return (
    <DiscussionView
      ref={viewRef}
      navigation={navigation}
      id={discussionId}
      postId={postId}
      bottomInset={bottomInset}
      showBoard={showBoard}
      showHeader={showHeader}
      showReplies={showReplies}
      showStats={showStats}
      jumpToLastSeen={jumpToLastSeen}
      lastSeenPostId={lastSeenPostId}
      onDiscussionFetched={({ title, uploadedFiles }) => navigation.setOptions({ title })} //todo show uploaded files len if any
      onImages={(images, imgIndex) =>
        navigation.navigate('gallery', {
          images,
          imgIndex,
          onClose: (focusPostId: number) =>
            viewRef.current?.flushImageReveals()?.then(() => viewRef.current?.scrollToPostById(focusPostId)),
          onViewImage: (img: any) => viewRef.current?.revealPostImage(img),
          onRated: (updatedPost: any) => viewRef.current?.onPostRated(updatedPost),
        })
      }
    />
  )
}
