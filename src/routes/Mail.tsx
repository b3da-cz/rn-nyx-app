import React, { useRef } from 'react'
import { MailView } from '../view'

export const Mail = ({ navigation }) => {
  const viewRef = useRef<MailView>(null)
  return (
    <MailView
      ref={viewRef}
      navigation={navigation}
      onImages={(images, imgIndex) =>
        navigation.navigate('gallery', {
          images,
          imgIndex,
          onViewImage: (img: any) => viewRef.current?.revealPostImage(img),
        })
      }
      onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
    />
  )
}
