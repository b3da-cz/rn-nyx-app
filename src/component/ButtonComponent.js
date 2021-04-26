import React from 'react'
import { Styling } from '../lib'
import { Text } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { TouchableRipple } from 'react-native-paper'

export const ButtonComponent = ({
  label,
  icon,
  isDarkMode,
  onPress,
  width = '100%',
  textAlign = 'center',
  color = Styling.colors.primary,
  fontSize = Styling.metrics.fontSize.xlarge,
  marginBottom = 0,
}) => {
  return (
    <TouchableRipple
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={[Styling.groups.themeComponent(isDarkMode), { width, fontSize, marginBottom, lineHeight: 50 }]}
      onPress={() => onPress()}>
      <Text
        style={{
          color,
          fontSize,
          textAlign,
          lineHeight: 50,
          paddingHorizontal: 5,
        }}>
        {icon?.length > 0 && <Icon name={icon} size={fontSize} color={color} />}
        {` ${label}`}
      </Text>
    </TouchableRipple>
  )
}
