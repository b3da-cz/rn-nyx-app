import React, { useState } from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { Styling } from '../lib'

export const SpoilerComponent = ({ children, text }) => {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <View>
      {isVisible ? (
        <Text
          style={{
            padding: Styling.metrics.block.medium,
            fontSize: Styling.metrics.fontSize.medium,
            color: Styling.colors.lighter,
            borderWidth: 1,
            borderColor: Styling.colors.dark,
          }}>
          {text}
        </Text>
      ) : (
        <TouchableRipple
          style={{ padding: Styling.metrics.block.medium, borderWidth: 1, borderColor: Styling.colors.secondary }}
          rippleColor={'rgba(18,146,180, 0.3)'}
          onPress={() => setIsVisible(true)}>
          <Text
            style={{ fontSize: Styling.metrics.fontSize.large, color: Styling.colors.secondary, textAlign: 'center' }}>
            SPOILER
          </Text>
        </TouchableRipple>
      )}
    </View>
  )
}
