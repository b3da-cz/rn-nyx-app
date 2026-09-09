import React, { useRef } from 'react'
import { LastPostsView } from '../view'

export const LastPosts = ({ navigation }) => {
  const viewRef = useRef<LastPostsView>(null)
  return (
    <LastPostsView
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
