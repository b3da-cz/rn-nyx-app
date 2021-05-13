import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Styling } from '../lib'

export const ButtonRepliesComponent = ({ count, isDarkMode, onPress }) => {
  return (
    <TouchableRipple
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={[Styling.groups.squareBtn, { width: 20, height: 20, backgroundColor: 'inherit' }]}
      onPress={() => onPress()}>
      <View style={{ alignItems: 'center' }}>
        <Icon name={'chevron-up'} size={10} color={isDarkMode ? Styling.colors.mediumlight : Styling.colors.medium} />
        <Text
          style={{
            color: isDarkMode ? Styling.colors.mediumlight : Styling.colors.medium,
            fontSize: 15,
            marginTop: -4,
          }}>
          {count}
        </Text>
      </View>
    </TouchableRipple>
  )
}
