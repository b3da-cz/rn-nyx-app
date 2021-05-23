import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { UserIconComponent } from '../component'
import { Styling } from '../lib'

export const UserRowComponent = ({
  user,
  isDarkMode,
  extraText,
  borderLeftWidth = 0,
  borderColor = 'inherit',
  marginBottom = Styling.metrics.block.xsmall,
  marginTop = 0,
  isPressable = true,
  withIcon = true,
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
        borderLeftWidth,
        borderColor,
        marginBottom,
        marginTop,
      }}
      onPress={() => onPress()}>
      <View style={[Styling.groups.flexRowSpbCentered, { height: 35 - (2 * Styling.metrics.block.small) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {withIcon && <UserIconComponent username={user.username} width={20} height={25} marginRight={10} />}
          <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker }}>{user.username}</Text>
        </View>
        {extraText?.length > 0 && (
          <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker }}>{extraText}</Text>
        )}
      </View>
    </TouchableRipple>
  )
}
