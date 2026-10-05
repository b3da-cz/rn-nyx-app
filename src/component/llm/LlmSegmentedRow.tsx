import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { useTheme } from '../../lib'

type Option<T extends string> = { key: T; label: string }

type Props<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (key: T) => void
}

// Same look as the event RSVP switch (going / interested / not interested).
export const LlmSegmentedRow = <T extends string>({ options, value, onChange }: Props<T>) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.row,
        borderLeftWidth: 3,
        borderColor: colors.primary,
        marginBottom: blocks.small,
      }}>
      {options.map((option, index) => {
        const selected = option.key === value
        return (
          <TouchableRipple
            key={option.key}
            rippleColor={colors.ripple}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => !selected && onChange(option.key)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: blocks.medium,
              paddingHorizontal: 4,
              backgroundColor: selected ? colors.card : colors.transparent,
              borderRightWidth: index < options.length - 1 ? 1 : 0,
              borderColor: colors.border,
            }}>
            <Text
              numberOfLines={1}
              style={{
                color: selected ? colors.text : colors.faded,
                fontSize: fontSizes.small,
                fontWeight: selected ? '700' : '400',
                textAlign: 'center',
              }}>
              {option.label}
            </Text>
          </TouchableRipple>
        )
      })}
    </View>
  )
}
