import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Styling } from '../lib'

export const SpoilerComponent = ({ children, text, isVisible, onPress }) => {
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
        <TouchableOpacity
          style={{ padding: Styling.metrics.block.medium, borderWidth: 1, borderColor: Styling.colors.secondary }}
          accessibilityRole="button"
          onPress={() => onPress()}>
          <Text
            style={{ fontSize: Styling.metrics.fontSize.large, color: Styling.colors.secondary, textAlign: 'center' }}>
            SPOILER
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
