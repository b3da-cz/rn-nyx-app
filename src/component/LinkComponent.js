import React from 'react'
import { Text, TouchableRipple } from 'react-native-paper'
import { Styling } from '../lib'

export const LinkComponent = ({ children, color = Styling.colors.secondary, fontSize = 16, onPress }) => {
  return (
    <TouchableRipple
      // style={{borderWidth: 1, borderColor: 'blue'}}
      style={{ marginHorizontal: Styling.metrics.block.small }}
      rippleColor={'rgba(18,146,180, 0.3)'}
      onPress={() => onPress()}>
      <Text
        style={[
          { color, fontSize, margin: 0, paddingVertical: Styling.metrics.block.xsmall },
        ]}>
        {children}
      </Text>
    </TouchableRipple>
  )
}
