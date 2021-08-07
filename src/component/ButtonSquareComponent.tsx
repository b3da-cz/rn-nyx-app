import React from 'react'
import Icon from 'react-native-vector-icons/Feather'
import { TouchableRipple } from 'react-native-paper'
import { Styling, useTheme } from '../lib'

type Props = {
  icon: string
  isDisabled?: boolean
  onPress: Function
  onLongPress?: Function
  color?: string
  backgroundColor?: string
  size?: number
  borderColor?: string
  marginBottom?: number
  marginTop?: number
  borderWidth?: number
  width?: number
  height?: number
}
export const ButtonSquareComponent = ({
  icon,
  isDisabled,
  onPress,
  onLongPress,
  color,
  backgroundColor,
  size,
  borderColor,
  marginBottom = 0,
  marginTop = 0,
  borderWidth = 0,
  width = 50,
  height = 50,
}: Props) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  return (
    <TouchableRipple
      disabled={isDisabled}
      rippleColor={colors.ripple}
      style={[
        Styling.groups.squareBtn,
        { backgroundColor, marginBottom, marginTop, borderColor, borderWidth, width, height },
      ]}
      onPress={() => onPress()}
      onLongPress={() => (typeof onLongPress === 'function' ? onLongPress() : null)}>
      <Icon name={icon} size={size || fontSizes.h2} color={color || colors.text} />
    </TouchableRipple>
  )
}
