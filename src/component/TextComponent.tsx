import React from 'react'
import { Text } from 'react-native-paper'
import { useTheme } from '../lib'

type Props = {
  children: any
  isBold?: boolean
  isItalic?: boolean
  isPressable?: boolean
  isReply?: boolean
  onPress?: Function
  onPlainPress?: Function
}
export const TextComponent = ({ children, isBold, isItalic, isPressable, isReply, onPress, onPlainPress }: Props) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  const color = isPressable ? (isReply ? colors.accent : colors.link) : colors.text
  return (
    <Text
      style={{
        color,
        fontSize: fontSizes.p,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: isItalic ? 'italic' : 'normal',
      }}
      onPress={
        isPressable && typeof onPress === 'function'
          ? () => onPress()
          : typeof onPlainPress === 'function'
            ? () => onPlainPress()
            : undefined
      }>
      {children}
    </Text>
  )
}
