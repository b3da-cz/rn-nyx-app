import React from 'react'
import Icon from 'react-native-vector-icons/Feather'
import { Text, TouchableRipple } from 'react-native-paper'
import { useTheme } from '../lib'

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
}) => {
  let th = { ...useTheme() }
  if (!th.metrics) {
    // we are inside Portal
    th = theme || console.error('btn in portal without theme prop') //todo
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
        {icon?.length > 0 && <Icon name={icon} size={fontSize} color={color || colors.text} />}
        {icon?.length > 0 && ' '}
        {`${label}`}
      </Text>
    </TouchableRipple>
  )
}
