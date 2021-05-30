import React from 'react'
import { Text } from 'react-native-paper'
import { useTheme } from '../lib'

export const TextComponent = ({ children, isPressable, isReply, onPress }) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  const color = isPressable ? (isReply ? colors.accent : colors.link) : colors.text
  return (
    <Text style={{ color, fontSize: fontSizes.p }} onPress={() => (isPressable ? onPress() : null)}>
      {children}
    </Text>
  )
}
