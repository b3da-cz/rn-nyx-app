import React, { useState } from 'react'
import { Linking, Image, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import YoutubePlayer from 'react-native-youtube-iframe'
import { LinkComponent } from '../component'
import { Styling } from '../lib'

export const VideoYoutubeComponent = ({ videoId, videoLink, previewSrc, backgroundColor, width, height }) => {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <View>
      <LinkComponent onPress={() => Linking.openURL(videoLink).catch(() => null)}>{videoLink}</LinkComponent>
      {isVisible ? (
        <YoutubePlayer height={Styling.metrics.window().width / 1.777} videoId={videoId} />
      ) : (
        <TouchableRipple
          // style={{borderWidth: 1, borderColor: 'red'}}
          rippleColor={'rgba(18,146,180, 0.3)'}
          onPress={() => setIsVisible(true)}>
          <Image
            style={{
              width,
              height,
              backgroundColor,
              margin: Styling.metrics.block.small,
            }}
            // loadingIndicatorSource={'debug..'}
            resizeMethod={'scale'}
            resizeMode={'cover'}
            source={{ uri: previewSrc }}
          />
        </TouchableRipple>
      )}
    </View>
  )
}
