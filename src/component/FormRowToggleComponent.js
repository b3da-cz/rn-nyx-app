import React from 'react'
import { Switch, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useTheme } from '../lib'

export const FormRowToggleComponent = ({ label, value, onChange }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <View
      style={{
        paddingVertical: blocks.medium,
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
