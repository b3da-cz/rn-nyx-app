import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { UserRowComponent } from '../component'
import { Styling } from '../lib'

export const DiceComponent = ({ children, isDarkMode, label, count, sides, rolls, canRoll, onRoll }) => {
  return (
    <View>
      <Text
        style={{
          padding: Styling.metrics.block.medium,
          fontSize: Styling.metrics.fontSize.medium,
          color: Styling.colors.secondary,
        }}>
        {label}
      </Text>
      {rolls?.length > 0 &&
        rolls.map(r => (
          <UserRowComponent user={r.user} isDarkMode={isDarkMode} isPressable={false} extraText={r.rolls?.toString()} />
        ))}
      {canRoll && (
        <TouchableRipple
          style={{ padding: Styling.metrics.block.medium, borderWidth: 1, borderColor: Styling.colors.secondary }}
          rippleColor={'rgba(18,146,180, 0.3)'}
          onPress={() => onRoll()}>
          <Text
            style={{ fontSize: Styling.metrics.fontSize.large, color: Styling.colors.secondary, textAlign: 'center' }}>
            {`${count}d${sides}`}
          </Text>
        </TouchableRipple>
      )}
    </View>
  )
}
