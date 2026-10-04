import React from 'react'
import { LlmAssistantView } from '../view'

export const LlmAssistant = ({ navigation, route }) => {
  const { discussionId, discussionTitle, posts } = route?.params || {}
  return (
    <LlmAssistantView
      navigation={navigation}
      discussionId={discussionId}
      discussionTitle={discussionTitle}
      initialPosts={posts}
    />
  )
}
