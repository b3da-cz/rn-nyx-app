import React from 'react'
import { Text, TouchableRipple } from 'react-native-paper'
import { useTheme } from '../lib'

export const LinkComponent = ({ children, color, onPress }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <TouchableRipple style={{ marginHorizontal: blocks.medium }} rippleColor={colors.ripple} onPress={() => onPress()}>
      <Text style={[{ color: color || colors.link, fontSize: fontSizes.p, margin: 0, paddingVertical: blocks.small }]}>
        {children}
      </Text>
    </TouchableRipple>
  )
}
