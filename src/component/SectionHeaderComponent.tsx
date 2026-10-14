import React from 'react'
import { PixelRatio, Text, View } from 'react-native'
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
  // Bake the system scale into the size. A fixed row measures shorter than the
  // scaled glyphs, so the title was clipped even with minHeight.
  const fontScale = PixelRatio.getFontScale() || 1
  const titleSize = fontSizes.p * fontScale
  const titleLine = Math.ceil(titleSize * 1.35)
  const rowHeight = Math.max(blocks.rowDiscussion, titleLine + blocks.medium)
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
        minHeight: rowHeight,
      }}>
      <View style={[Styling.groups.flexRowSpbCentered, { minHeight: rowHeight, alignItems: 'stretch' }]}>
        <TouchableRipple
          disabled={!isPressable}
          rippleColor={colors.ripple}
          style={{ flex: 1 }}
          onPress={pressHeader}>
          <View
            style={[
              Styling.groups.flexRowSpbCentered,
              {
                flex: 1,
                minHeight: rowHeight,
                paddingLeft: blocks.medium,
                paddingRight: hasIconAction ? 0 : blocks.medium,
              },
            ]}>
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              style={{ flex: 1, fontSize: titleSize, lineHeight: titleLine, color: colors.text }}>
              {title}
            </Text>
            {!hasIconAction && iconNode}
          </View>
        </TouchableRipple>
        {hasIconAction && (
          <TouchableRipple
            rippleColor={colors.ripple}
            style={{
              minHeight: rowHeight,
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
