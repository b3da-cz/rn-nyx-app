import React from 'react'
import { Image, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { IBMColorPalette } from '../lib/Palette'
import { useTheme } from '../lib/Theme'

type Props = {
  username: string
  width?: number
  height?: number
  borderColor?: string
  borderWidth?: number
  marginTop?: number
  marginBottom?: number
  marginRight?: number
  marginLeft?: number
  attendance?: 'going' | 'interested' | null
}
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
  attendance,
}: Props) => {
  const { colors } = useTheme()
  if (!username) {
    username = 'B3DA_API_TEST' // default icon, todo
  }
  username = username.toUpperCase()
  const isDark = colors?.text !== IBMColorPalette.black
  const badge = Math.max(12, Math.round(width * 0.55))
  const badgeStyle =
    attendance === 'interested'
      ? { backgroundColor: IBMColorPalette.coolGray20, color: IBMColorPalette.coolGray80, icon: 'eye' }
      : attendance === 'going'
        ? {
            backgroundColor: isDark ? IBMColorPalette.white : IBMColorPalette.black,
            color: isDark ? IBMColorPalette.black : IBMColorPalette.white,
            icon: 'user',
          }
        : null
  return (
    <View style={{ width, height, marginTop, marginBottom, marginRight, marginLeft }}>
      <Image
        style={{ width, height, borderColor, borderWidth }}
        resizeMethod={'scale'}
        resizeMode={'contain'}
        source={{ uri: `https://nyx.cz/${username[0]}/${username}.gif` }}
      />
      {badgeStyle && (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            zIndex: 1,
            width: badge,
            height: badge,
            borderRadius: 3,
            backgroundColor: badgeStyle.backgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name={badgeStyle.icon} size={Math.max(8, badge - 4)} color={badgeStyle.color} />
        </View>
      )}
    </View>
  )
}
