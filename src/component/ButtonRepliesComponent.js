import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Styling, useTheme } from '../lib'

export const ButtonRepliesComponent = ({ count, onPress }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <TouchableRipple
      rippleColor={colors.ripple}
      style={[Styling.groups.flexCentered, { width: blocks.large * 2, height: blocks.large * 1.4 }]}
      onPress={() => onPress()}>
      <View style={{ alignItems: 'center' }}>
        <Icon name={'chevron-up'} size={(fontSizes.p / 3) * 2} color={colors.accent} />
        <Text
          style={{
            color: colors.accent,
            fontSize: fontSizes.small,
            marginTop: -(fontSizes.p / 3),
          }}>
          {count}
        </Text>
      </View>
    </TouchableRipple>
  )
}
