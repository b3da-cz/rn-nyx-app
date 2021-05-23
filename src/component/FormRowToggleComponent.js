import React from 'react'
import { Switch, View } from 'react-native'
import { Text } from 'react-native-paper'
import { Styling } from '../lib'

export const FormRowToggleComponent = ({
  isDarkMode,
  label,
  value,
  fontSize = 18,
  toggleColorActive = Styling.colors.primary,
  toggleColorInactive = Styling.colors.lighter,
  paddingVertical = Styling.metrics.block.medium,
  onChange,
}) => {
  return (
    <View
      style={{
        paddingVertical,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Text style={{ fontSize }} onPress={() => onChange(!value)}>
        {label}
      </Text>
      <Switch
        thumbColor={value ? toggleColorActive : toggleColorInactive}
        onValueChange={val => onChange(val)}
        value={value}
      />
    </View>
  )
}
