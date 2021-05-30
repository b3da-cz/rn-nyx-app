import React, { useCallback, useState } from 'react'
import { BackHandler } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { FAB, Portal } from 'react-native-paper'

export const FabComponent = ({
  isVisible,
  actions = [],
  iconOpen,
  iconClosed = 'plus',
  backgroundColor,
  paddingBottom = 45,
  onPress,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isOpen) {
          setIsOpen(false)
          return true
        } else {
          return false
        }
      }
      BackHandler.addEventListener('hardwareBackPress', onBackPress)
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress)
    }, [isOpen]),
  )

  return (
    <Portal>
      <FAB.Group
        visible={isVisible}
        open={isOpen}
        icon={isOpen ? iconOpen : iconClosed}
        fabStyle={{ backgroundColor }}
        actions={actions}
        onStateChange={({ open }) => setIsOpen(open)}
        onPress={() => {
          onPress(isOpen)
          if (isOpen) {
            setIsOpen(false)
          }
        }}
        style={{ paddingBottom }}
      />
    </Portal>
  )
}
