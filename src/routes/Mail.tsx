import React, { useRef } from 'react'
import { MailView } from '../view'

export const Mail = ({ navigation, route }) => {
  const viewRef = useRef<MailView>(null)
  const { sharedText, sharedFile, sharedAt } = route?.params || {}
  return (
    <MailView
      ref={viewRef}
      navigation={navigation}
      sharedText={sharedText}
      sharedFile={sharedFile}
      sharedAt={sharedAt}
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
