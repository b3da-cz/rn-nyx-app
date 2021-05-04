import React from 'react'
import { NotificationsView } from '../view'

export const Notifications = ({ navigation }) => (
  <NotificationsView
    navigation={navigation}
    onImages={(images, imgIndex) => navigation.navigate('gallery', { images, imgIndex })}
  />
)
