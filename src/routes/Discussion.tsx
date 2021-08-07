import React from 'react'
import { DiscussionView } from '../view'

export const Discussion = ({ navigation, route }) => {
  const { discussionId, postId, showBoard, showHeader, showReplies, showStats, jumpToLastSeen } = route.params
  return (
    <DiscussionView
      // ref={r => setRef('DiscussionView', r)} // todo forwardRef
      navigation={navigation}
      id={discussionId}
      postId={postId}
      showBoard={showBoard}
      showHeader={showHeader}
      showReplies={showReplies}
      showStats={showStats}
      jumpToLastSeen={jumpToLastSeen}
      onDiscussionFetched={({ title, uploadedFiles }) => navigation.setOptions({ title })} //todo show uploaded files len if any
      onImages={(images, imgIndex) => navigation.navigate('gallery', { images, imgIndex })}
    />
  )
}
