import React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { Styling } from '../lib'

export const LinkComponent = ({ children, color = Styling.colors.primary, fontSize = 16, onPress }) => {
  return (
    <TouchableOpacity
      // style={{borderWidth: 1, borderColor: 'blue'}}
      accessibilityRole="button"
      onPress={() => onPress()}>
      <Text
        style={[
          { color, fontSize, margin: 0, paddingVertical: Styling.metrics.block.xsmall },
        ]}>
        {children}
      </Text>
    </TouchableOpacity>
  )
}
