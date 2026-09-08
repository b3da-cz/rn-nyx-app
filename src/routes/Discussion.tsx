import React, { useRef } from 'react'
import { DiscussionView } from '../view'

export const Discussion = ({ navigation, route }) => {
  const viewRef = useRef<DiscussionView>(null)
  const { discussionId, postId, showBoard, showHeader, showReplies, showStats, jumpToLastSeen, lastSeenPostId } =
    route.params
  return (
    <DiscussionView
      ref={viewRef}
      navigation={navigation}
      id={discussionId}
      postId={postId}
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
          onClose: (focusPostId: number) => viewRef.current?.scrollToPostById(focusPostId),
          onRated: (updatedPost: any) => viewRef.current?.onPostRated(updatedPost),
        })
      }
    />
  )
}
