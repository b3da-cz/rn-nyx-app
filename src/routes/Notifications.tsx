import React, { useRef } from 'react'
import { NotificationsView } from '../view'

export const Notifications = ({ navigation }) => {
  const viewRef = useRef<NotificationsView>(null)
  return (
    <NotificationsView
      ref={viewRef}
      navigation={navigation}
      onImages={(images, imgIndex) =>
        navigation.navigate('gallery', {
          images,
          imgIndex,
          onViewImage: (img: any) => viewRef.current?.revealPostImage(img),
        })
      }
    />
  )
}
