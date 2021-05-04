import React from 'react'
import { HistoryView } from '../view'

export const History = ({ navigation }) => {
  return (
    <HistoryView
      navigation={navigation}
      onDetailShow={discussionId => navigation.push('discussion', { discussionId, jumpToLastSeen: true })}
    />
  )
}
