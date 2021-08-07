import React from 'react'
import { LastPostsView } from '../view'

export const LastPosts = ({ navigation }) => (
  <LastPostsView
    navigation={navigation}
    onImages={(images, imgIndex) => navigation.navigate('gallery', { images, imgIndex })}
  />
)
