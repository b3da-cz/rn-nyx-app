import React from 'react'
import { Text, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Styling, useTheme } from '../lib'

type Props = {
  title: string
  icon?: string
  backgroundColor?: string
  isPressable?: boolean
  onPress?: Function
}
export const SectionHeaderComponent = ({ title, icon, backgroundColor, isPressable, onPress }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <TouchableRipple
      disabled={!isPressable}
      rippleColor={colors.ripple}
      style={{
        width: '100%',
        backgroundColor: backgroundColor || colors.tertiary,
        marginBottom: blocks.small,
        height: blocks.rowDiscussion,
      }}
      onPress={() => (typeof onPress === 'function' ? onPress() : null)}>
      <View style={[Styling.groups.flexRowSpbCentered, { paddingHorizontal: blocks.medium }]}>
        <Text
          style={{
            fontSize: fontSizes.p,
            color: colors.text,
            paddingVertical: blocks.medium,
          }}>
          {title}
        </Text>
        {icon && icon.length > 0 && <Icon name={icon} size={fontSizes.p} color={colors.text} />}
      </View>
    </TouchableRipple>
  )
}
