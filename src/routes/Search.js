import React from 'react'
import { SearchView } from '../view'

export const Search = ({ navigation }) => (
  <SearchView
    onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
    onUserSelected={username => navigation.push('composePost', { isMailPost: true, username })}
  />
)
