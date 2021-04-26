import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { UserIconComponent } from '../component'
import { Styling } from '../lib'

export const UserRowComponent = ({
  user,
  isDarkMode,
  extraText,
  marginBottom = Styling.metrics.block.small,
  marginTop = 0,
  isPressable = true,
  onPress,
}) => {
  return (
    <TouchableRipple
      disabled={!isPressable}
      key={user.username}
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={{
        backgroundColor: isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
        paddingVertical: Styling.metrics.block.small,
        paddingHorizontal: Styling.metrics.block.small,
        marginBottom,
        marginTop,
      }}
      onPress={() => onPress()}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <UserIconComponent username={user.username} width={20} height={25} marginRight={10} />
          <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker }}>{user.username}</Text>
        </View>
        {extraText?.length > 0 && (
          <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker }}>{extraText}</Text>
        )}
      </View>
    </TouchableRipple>
  )
}
