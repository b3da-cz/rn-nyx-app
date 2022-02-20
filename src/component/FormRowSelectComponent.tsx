import React, { useState } from 'react'
import { View } from 'react-native'
import { Button, Divider, Menu } from 'react-native-paper'
import { t, useTheme } from '../lib'

type Props = {
  hasAll?: boolean
  selectionColor?: string
  value?: string
  options: Array<{ key?: string; value: string; label?: string; color?: string; icon?: string; disabled?: boolean }>
  width?: number | string
  marginLeft?: number | string
  onSelect: Function
}
export const FormRowSelectComponent = ({
  hasAll,
  selectionColor,
  value,
  options = [],
  width,
  marginLeft,
  onSelect,
}: Props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const theme = useTheme()

  const onSelection = (nextValue: string | undefined) => {
    onSelect(nextValue)
    setIsOpen(false)
  }
  const { colors } = theme
  return (
    <Menu
      visible={isOpen}
      onDismiss={() => setIsOpen(false)}
      anchor={
        <View style={{ width, marginLeft }}>
          <Button onPress={() => setIsOpen(true)} uppercase={false} color={selectionColor || colors.text}>
            {`${value}`}
          </Button>
        </View>
      }>
      {hasAll && <Menu.Item onPress={() => onSelection('all')} title={t('all')} />}
      {hasAll && <Divider />}
      {options.map(option => (
        <Menu.Item
          key={option.key || option.value}
          onPress={() => onSelection(option.value)}
          title={option.label || option.value}
          icon={option.icon}
          disabled={option.disabled}
          style={{ backgroundColor: option.color }}
        />
      ))}
    </Menu>
  )
}
