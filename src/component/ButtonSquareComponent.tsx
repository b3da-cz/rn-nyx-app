import React from 'react'
import Icon from 'react-native-vector-icons/Feather'
import { TouchableRipple } from 'react-native-paper'
import { RectButton } from 'react-native-gesture-handler'
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
  width?: number | string
  height?: number
  // RNGH RectButton cooperates with parent Swipeable; RN Pressable often loses the tap.
  rectButton?: boolean
}
export const ButtonSquareComponent: React.FC<Props> = ({
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
  rectButton = false,
}: Props) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  const style = [
    Styling.groups.squareBtn,
    { backgroundColor, marginBottom, marginTop, borderColor, borderWidth, width, height },
  ]
  const iconEl = <Icon name={icon} size={size || fontSizes.h2} color={color || colors.text} />
  if (rectButton) {
    return (
      <RectButton
        enabled={!isDisabled}
        rippleColor={colors.ripple}
        foreground
        exclusive
        style={style}
        onPress={() => onPress()}>
        {iconEl}
      </RectButton>
    )
  }
  return (
    <TouchableRipple
      disabled={isDisabled}
      rippleColor={colors.ripple}
      style={style}
      onPress={() => onPress()}
      onLongPress={() => (typeof onLongPress === 'function' ? onLongPress() : null)}>
      {iconEl}
    </TouchableRipple>
  )
}
