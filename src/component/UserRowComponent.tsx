import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { UserIconComponent } from '../component'
import { Styling, Theme, useTheme } from '../lib'

type Props = {
  user: { username: string }
  theme?: Theme
  extraText?: string
  borderLeftWidth?: number
  borderColor?: string
  marginBottom?: number
  marginTop?: number
  isPressable?: boolean
  withIcon?: boolean
  onPress?: Function
}
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
}: Props) => {
  let th: any = { ...useTheme() }
  if (!th.metrics) {
    // we are inside Portal
    th = theme || console.error('user row in portal without theme prop') //todo
  }
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = th
  return (
    <TouchableRipple
      disabled={!isPressable}
      key={user.username}
      rippleColor={colors.ripple}
      style={{
        backgroundColor: colors.row,
        paddingVertical: blocks.medium,
        paddingHorizontal: blocks.medium,
        borderLeftWidth,
        borderColor,
        marginBottom: marginBottom !== undefined ? marginBottom : blocks.small,
        marginTop,
      }}
      onPress={() => (typeof onPress === 'function' ? onPress() : null)}>
      <View style={[Styling.groups.flexRowSpbCentered, { height: blocks.rowDiscussion - 2 * blocks.medium }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {withIcon && (
            <UserIconComponent
              username={user.username}
              width={blocks.medium * 4}
              height={blocks.medium * 5}
              marginRight={10}
            />
          )}
          <Text style={{ fontSize: fontSizes.p }}>{user.username}</Text>
        </View>
        {extraText && extraText.length > 0 && <Text style={{ fontSize: fontSizes.p }}>{extraText}</Text>}
      </View>
    </TouchableRipple>
  )
}
