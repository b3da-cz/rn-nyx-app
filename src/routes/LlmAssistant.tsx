import React from 'react'
import { LlmAssistantView } from '../view'

export const LlmAssistant = ({ navigation, route }) => {
  const { discussionId, discussionTitle, posts, agentRule, viewerRights } = route?.params || {}
  return (
    <LlmAssistantView
      navigation={navigation}
      discussionId={discussionId}
      discussionTitle={discussionTitle}
      initialPosts={posts}
      agentRule={agentRule}
      viewerRights={viewerRights}
    />
  )
}
