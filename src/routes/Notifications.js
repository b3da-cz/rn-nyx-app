import React from 'react'
import { NotificationsView } from '../view'

export const Notifications = ({ navigation }) => (
  <NotificationsView
    onImages={(images, imgIndex) => navigation.navigate('gallery', { images, imgIndex })}
    onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
  />
)
