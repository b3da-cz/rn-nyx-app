import React, { useCallback, useState } from 'react'
import { Switch, Text, View } from 'react-native'
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
      <Text
        style={[Styling.groups.themeComponent(isDarkMode), { fontSize, backgroundColor: 'transparent' }]}
        onPress={() => onChange(!value)}>
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
