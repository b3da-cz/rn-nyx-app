import React from 'react'
import { TouchableOpacity, Linking, Image, View } from 'react-native'
import YoutubePlayer from 'react-native-youtube-iframe'
import { LinkComponent } from '../component'
import { Styling } from '../lib'

export const VideoYoutubeComponent = ({
  videoId,
  videoLink,
  previewSrc,
  isPlayerVisible,
  backgroundColor,
  width,
  height,
  onPreviewPress,
}) => {
  return (
    <View>
      <LinkComponent onPress={() => Linking.openURL(videoLink).catch(() => null)}>{videoLink}</LinkComponent>
      {isPlayerVisible ? (
        <YoutubePlayer height={Styling.metrics.window().width / 1.777} videoId={videoId} />
      ) : (
        <TouchableOpacity
          // style={{borderWidth: 1, borderColor: 'red'}}
          accessibilityRole="button"
          onPress={() => onPreviewPress()}>
          <Image
            style={{
              width,
              height,
              backgroundColor,
              margin: Styling.metrics.block.small,
            }}
            resizeMethod={'scale'}
            resizeMode={'center'}
            source={{ uri: previewSrc }}
          />
        </TouchableOpacity>
      )}
    </View>
  )
}
