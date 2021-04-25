import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { UserIconComponent } from '../component'
import { Styling } from '../lib'

export const UserRowComponent = ({ user, isDarkMode, onPress }) => {
  return (
    <TouchableRipple
      key={user.username}
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={{
        backgroundColor: isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
        paddingVertical: Styling.metrics.block.small,
        paddingHorizontal: Styling.metrics.block.small,
        marginBottom: Styling.metrics.block.small,
      }}
      onPress={() => onPress()}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <UserIconComponent username={user.username} width={20} height={25} marginRight={10} />
        <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker }}>{user.username}</Text>
      </View>
    </TouchableRipple>
  )
}
