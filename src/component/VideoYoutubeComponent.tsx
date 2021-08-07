import React, { useState } from 'react'
import { Linking, Image, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import YoutubePlayer from 'react-native-youtube-iframe'
import { LinkComponent } from '../component'
import { useTheme } from '../lib'

export const VideoYoutubeComponent = ({ videoId, videoLink, previewSrc }) => {
  const [isVisible, setIsVisible] = useState(false)
  const {
    colors,
    metrics: { blocks, screen },
  } = useTheme()
  const width = screen.width - 2 * blocks.large
  const height = width / 1.777
  return (
    <View>
      <LinkComponent onPress={() => Linking.openURL(videoLink).catch(() => null)}>{videoLink}</LinkComponent>
      {isVisible ? (
        <YoutubePlayer height={height} videoId={videoId} />
      ) : (
        <TouchableRipple rippleColor={colors.ripple} onPress={() => setIsVisible(true)}>
          <Image
            style={{
              width,
              height,
              backgroundColor: 'transparent',
              margin: blocks.medium,
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
