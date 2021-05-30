import React from 'react'
import { Image } from 'react-native'

export const UserIconComponent = ({
  username,
  width = 32, // height / width === 1.25 (original 50 * 40)
  height = 40,
  borderColor,
  borderWidth = 0,
  marginTop = 0,
  marginBottom = 0,
  marginRight = 0,
  marginLeft = 0,
  onPress,
}) => {
  if (!username) {
    username = 'B3DA_API_TEST' // default icon, todo
  }
  username = username.toUpperCase()
  return (
    <Image
      style={{
        width,
        height,
        borderColor,
        borderWidth,
        marginTop,
        marginBottom,
        marginRight,
        marginLeft,
      }}
      resizeMethod={'scale'}
      resizeMode={'contain'}
      source={{ uri: `https://nyx.cz/${username[0]}/${username}.gif` }}
    />
  )
}
