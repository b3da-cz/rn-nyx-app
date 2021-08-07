import React from 'react'
import { MailView } from '../view'

export const Mail = ({ navigation }) => (
  <MailView
    // ref={r => setRef('MailView', r)} // todo forwardRef
    navigation={navigation}
    onImages={(images, imgIndex) => navigation.navigate('gallery', { images, imgIndex })}
    onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
  />
)
