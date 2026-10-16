import React from 'react'
import { Switch, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useTheme } from '../lib'

type Props = {
  label: string
  value: boolean
  onChange: Function
  card?: boolean
  rowHeight?: number
}
export const FormRowToggleComponent = ({ label, value, onChange, card, rowHeight }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <View
      style={{
        height: card && rowHeight ? rowHeight : undefined,
        paddingVertical: card ? (rowHeight ? 0 : blocks.medium + blocks.small) : blocks.medium,
        paddingHorizontal: blocks.medium,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: card ? colors.surface : undefined,
        borderRadius: 0,
        marginBottom: card ? blocks.small : 0,
      }}>
      <Text style={{ flex: 1, fontSize: fontSizes.p, color: colors.text, paddingRight: blocks.medium }} onPress={() => onChange(!value)}>
        {label}
      </Text>
      <Switch
        thumbColor={value ? colors.primary : colors.disabled}
        onValueChange={val => onChange(val)}
        value={value}
      />
    </View>
  )
}
