import React from 'react'
import { BookmarksView } from '../view'

export const Bookmarks = ({ navigation }) => (
  <BookmarksView
    navigation={navigation}
    onDetailShow={discussionId => navigation.push('discussion', { discussionId, jumpToLastSeen: true })}
  />
)
