import React from 'react'
import { Text, TouchableRipple } from 'react-native-paper'
import { Styling } from '../lib'

export const LinkComponent = ({
  children,
  color = Styling.colors.secondary,
  fontSize = 16,
  marginHorizontal = Styling.metrics.block.small,
  paddingVertical = Styling.metrics.block.xsmall,
  onPress,
}) => {
  return (
    <TouchableRipple
      // style={{borderWidth: 1, borderColor: 'blue'}}
      style={{ marginHorizontal }}
      rippleColor={'rgba(18,146,180, 0.3)'}
      onPress={() => onPress()}>
      <Text style={[{ color, fontSize, margin: 0, paddingVertical }]}>{children}</Text>
    </TouchableRipple>
  )
}
