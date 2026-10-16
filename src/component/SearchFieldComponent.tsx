import React from 'react'
import type { ReactNode } from 'react'
import { TextInput, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { useTheme } from '../lib'

type Props = {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  right?: ReactNode
  style?: StyleProp<ViewStyle>
  autoCorrect?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

export const SearchFieldComponent = ({
  value,
  onChangeText,
  placeholder,
  right,
  style,
  autoCorrect = false,
  autoCapitalize = 'none',
}: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const active = value.length > 0
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 2,
          borderBottomColor: active ? colors.primary : 'transparent',
          paddingHorizontal: blocks.medium,
        },
        style,
      ]}>
      <Icon name="search" size={fontSizes.p} color={active ? colors.primary : colors.disabled} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.disabled}
        selectionColor={colors.primary}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
        numberOfLines={1}
        style={{
          flex: 1,
          height: 42,
          color: colors.text,
          paddingHorizontal: blocks.small,
          fontSize: fontSizes.p,
        }}
      />
      {active && (
        <TouchableRipple onPress={() => onChangeText('')} rippleColor={colors.ripple} style={{ padding: 4 }}>
          <Icon name="x" size={fontSizes.p} color={colors.disabled} />
        </TouchableRipple>
      )}
      {right}
    </View>
  )
}
