import React from 'react'
import Icon from 'react-native-vector-icons/Feather'
import { Text, TouchableRipple } from 'react-native-paper'
import { Theme, useTheme } from '../lib'

type Props = {
  label: string
  icon?: string
  theme?: Theme
  isDisabled?: boolean
  onPress: Function
  color?: string
  backgroundColor?: string
  borderColor?: string
  fontSize?: number
  paddingHorizontal?: number
  width?: string | number
  textAlign?: 'auto' | 'center' | 'left' | 'right' | 'justify' | undefined
  marginBottom?: number
  marginTop?: number
  marginHorizontal?: number
  borderWidth?: number
  lineHeight?: number
}
export const ButtonComponent = ({
  label,
  icon,
  theme,
  isDisabled,
  onPress,
  color,
  backgroundColor = 'transparent',
  borderColor,
  fontSize,
  paddingHorizontal,
  width = '100%',
  textAlign = 'center',
  marginBottom = 0,
  marginTop = 0,
  marginHorizontal = 0,
  borderWidth = 0,
  lineHeight = 50,
}: Props) => {
  let th: any = { ...useTheme() }
  if (!th.metrics) {
    // we are inside Portal
    th = theme
  }
  const {
    colors,
    metrics: { blocks },
  } = th
  return (
    <TouchableRipple
      disabled={isDisabled}
      rippleColor={colors.ripple}
      style={[
        {
          width,
          marginBottom,
          marginTop,
          marginHorizontal,
          borderColor,
          borderWidth,
          backgroundColor,
          height: lineHeight,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
      ]}
      onPress={() => onPress()}>
      <Text
        style={{
          fontSize,
          textAlign,
          width: '100%',
          color: color || colors.text,
          paddingHorizontal: paddingHorizontal || blocks.medium,
        }}>
        {icon && icon.length > 0 && <Icon name={icon} size={fontSize} color={color || colors.text} />}
        {icon && icon.length > 0 && ' '}
        {`${label}`}
      </Text>
    </TouchableRipple>
  )
}
