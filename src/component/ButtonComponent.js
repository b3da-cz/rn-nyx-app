import React from 'react'
import { Styling } from '../lib'
import { Text } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { TouchableRipple } from 'react-native-paper'

export const ButtonComponent = ({
  label,
  icon,
  isDarkMode,
  isDisabled,
  onPress,
  width = '100%',
  textAlign = 'center',
  color = Styling.colors.primary,
  backgroundColor = Styling.colors.black,
  fontSize = Styling.metrics.fontSize.xlarge,
  marginBottom = 0,
  marginTop = 0,
  marginHorizontal = 0,
  borderColor = Styling.colors.secondary,
  borderWidth = 0,
  lineHeight = 50,
  paddingHorizontal = 5,
}) => {
  return (
    <TouchableRipple
      disabled={isDisabled}
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={[
        Styling.groups.themeComponent(isDarkMode),
        {
          width,
          fontSize,
          marginBottom,
          marginTop,
          marginHorizontal,
          borderColor,
          borderWidth,
          backgroundColor,
          lineHeight,
        },
      ]}
      onPress={() => onPress()}>
      <Text
        style={{
          color,
          fontSize,
          textAlign,
          lineHeight,
          paddingHorizontal,
        }}>
        {icon?.length > 0 && <Icon name={icon} size={fontSize} color={color} />}
        {` ${label}`}
      </Text>
    </TouchableRipple>
  )
}
