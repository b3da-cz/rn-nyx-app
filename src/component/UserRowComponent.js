import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { UserIconComponent } from '../component'
import { Styling, useTheme } from '../lib'

export const UserRowComponent = ({
  user,
  theme,
  extraText,
  borderLeftWidth = 0,
  borderColor = 'inherit',
  marginBottom,
  marginTop = 0,
  isPressable = true,
  withIcon = true,
  onPress,
}) => {
  let th = { ...useTheme() }
  if (!th.metrics) {
    // we are inside Portal
    th = theme || console.error('user row in portal without theme prop') //todo
  }
  const {
    colors,
    metrics: { blocks },
  } = th
  return (
    <TouchableRipple
      disabled={!isPressable}
      key={user.username}
      rippleColor={colors.ripple}
      style={{
        backgroundColor: colors.surface,
        paddingVertical: blocks.medium,
        paddingHorizontal: blocks.medium,
        borderLeftWidth,
        borderColor,
        marginBottom: marginBottom !== undefined ? marginBottom : blocks.small,
        marginTop,
      }}
      onPress={() => onPress()}>
      <View style={[Styling.groups.flexRowSpbCentered, { height: 35 - 2 * blocks.medium }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {withIcon && <UserIconComponent username={user.username} width={20} height={25} marginRight={10} />}
          <Text>{user.username}</Text>
        </View>
        {extraText?.length > 0 && <Text>{extraText}</Text>}
      </View>
    </TouchableRipple>
  )
}
