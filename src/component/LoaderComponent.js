import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { useTheme } from '../lib'

export const LoaderComponent = ({
  label = '',
  icon,
  theme,
  width = '100%',
  height = '100%',
  textAlign = 'center',
  color,
  backgroundColor,
  fontSize,
  marginBottomSpinner = 0,
  marginBottom = 0,
  marginTop = 0,
  borderColor,
  borderWidth = 0,
}) => {
  let th = { ...useTheme() }
  if (!th.metrics) {
    // we are inside Portal or outside Nav
    th = theme || console.error('loader outside nav without theme prop') //todo
  }
  const {
    colors,
    metrics: { blocks },
  } = th
  return (
    <View
      style={{
        width,
        height,
        backgroundColor: backgroundColor || colors.background,
        marginBottom,
        marginTop,
        borderColor,
        borderWidth,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: marginBottomSpinner }} />
      {(label?.length > 0 || icon?.length > 0) && (
        <Text
          style={{
            color,
            fontSize: fontSize || fontSizes.h2,
            textAlign,
            lineHeight: 50,
            paddingHorizontal: blocks.medium,
          }}>
          {icon?.length > 0 && <Icon name={icon} size={fontSize || fontSizes.h2} color={color || colors.text} />}
          {` ${label}`}
        </Text>
      )}
    </View>
  )
}
