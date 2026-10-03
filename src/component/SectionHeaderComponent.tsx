import React from 'react'
import { Text, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { Styling, useTheme } from '../lib'

const iconPressExtendLeft = 10

type Props = {
  title: string
  icon?: string
  iconColor?: string
  iconFamily?: 'feather' | 'material-community'
  backgroundColor?: string
  isPressable?: boolean
  onPress?: Function
  onIconPress?: Function
}
export const SectionHeaderComponent = ({
  title,
  icon,
  iconColor,
  iconFamily = 'feather',
  backgroundColor,
  isPressable,
  onPress,
  onIconPress,
}: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const color = iconColor || colors.text
  const communityIcon = icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']
  const iconNode =
    icon && icon.length > 0 ? (
      iconFamily === 'material-community' ? (
        <MaterialCommunityIcons name={communityIcon} size={fontSizes.p} color={color} />
      ) : (
        <Icon name={icon} size={fontSizes.p} color={color} />
      )
    ) : null
  const hasIconAction = !!(iconNode && onIconPress)
  const pressHeader = () => (typeof onPress === 'function' ? onPress() : null)
  return (
    <View
      style={{
        width: '100%',
        backgroundColor: backgroundColor || colors.tertiary,
        marginBottom: blocks.small,
        height: blocks.rowDiscussion,
      }}>
      <View style={[Styling.groups.flexRowSpbCentered, { height: blocks.rowDiscussion }]}>
        <TouchableRipple
          disabled={!isPressable}
          rippleColor={colors.ripple}
          style={{ flex: 1, height: blocks.rowDiscussion }}
          onPress={pressHeader}>
          <View
            style={[
              Styling.groups.flexRowSpbCentered,
              {
                height: blocks.rowDiscussion,
                paddingLeft: blocks.medium,
                paddingRight: hasIconAction ? 0 : blocks.medium,
              },
            ]}>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: fontSizes.p, color: colors.text }}>
              {title}
            </Text>
            {!hasIconAction && iconNode}
          </View>
        </TouchableRipple>
        {hasIconAction && (
          <TouchableRipple
            rippleColor={colors.ripple}
            style={{
              height: blocks.rowDiscussion,
              paddingLeft: iconPressExtendLeft,
              paddingRight: blocks.medium,
              justifyContent: 'center',
            }}
            onPress={() => onIconPress()}>
            <View>{iconNode}</View>
          </TouchableRipple>
        )}
      </View>
    </View>
  )
}
