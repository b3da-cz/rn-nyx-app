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
      style={[Styling.groups.flexCentered, { width: blocks.large, height: blocks.large }]}
      onPress={() => onPress()}>
      <View style={{ alignItems: 'center' }}>
        <Icon name={'chevron-up'} size={(fontSizes.p / 3) * 2} color={colors.backdrop} />
        <Text
          style={{
            color: colors.backdrop,
            fontSize: fontSizes.small * 0.8,
            marginTop: -(fontSizes.p / 2.5),
          }}>
          {count}
        </Text>
      </View>
    </TouchableRipple>
  )
}
