import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { Styling } from '../lib'

export const LoaderComponent = ({
  label = '',
  icon,
  isDarkMode,
  width = '100%',
  height = '100%',
  textAlign = 'center',
  color = Styling.colors.primary,
  backgroundColor = Styling.colors.black,
  fontSize = Styling.metrics.fontSize.xlarge,
  marginBottomSpinner = 0,
  marginBottom = 0,
  marginTop = 0,
  borderColor = Styling.colors.secondary,
  borderWidth = 0,
}) => {
  return (
    <View
      style={[
        Styling.groups.themeComponent(isDarkMode),
        {
          width,
          height,
          backgroundColor,
          fontSize,
          marginBottom,
          marginTop,
          borderColor,
          borderWidth,
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 50,
          zIndex: 1,
        },
      ]}>
      <ActivityIndicator size="large" color={Styling.colors.primary} style={{ marginBottom: marginBottomSpinner }} />
      {(label?.length > 0 || icon?.length > 0) && (
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
      )}
    </View>
  )
}
