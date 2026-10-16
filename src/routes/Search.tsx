import React, { useRef } from 'react'
import { SearchView } from '../view'

export const Search = ({ navigation }) => {
  const viewRef = useRef<SearchView>(null)
  return (
    <SearchView
      ref={viewRef}
      onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
      onImages={(images, imgIndex) =>
        navigation.navigate('gallery', {
          images,
          imgIndex,
          onViewImage: (img: any) => viewRef.current?.revealPostImage(img),
        })
      }
      onUserSelected={username =>
        navigation.navigate('mailStack', {
          screen: 'mail',
          params: { composeUsername: username, composeAt: Date.now() },
        })
      }
    />
  )
}
