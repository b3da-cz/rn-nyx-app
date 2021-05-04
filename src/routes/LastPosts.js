import React from 'react'
import { LastPostsView } from '../view'

export const LastPosts = ({ navigation }) => (
  <LastPostsView
    onImages={(images, imgIndex) => navigation.navigate('gallery', { images, imgIndex })}
    onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
  />
)
