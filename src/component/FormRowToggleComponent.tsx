import React from 'react'
import { Switch, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useTheme } from '../lib'

type Props = {
  label: string
  value: boolean
  onChange: Function
}
export const FormRowToggleComponent = ({ label, value, onChange }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <View
      style={{
        paddingVertical: blocks.medium,
        paddingHorizontal: blocks.medium,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Text style={{ fontSize: fontSizes.p }} onPress={() => onChange(!value)}>
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
