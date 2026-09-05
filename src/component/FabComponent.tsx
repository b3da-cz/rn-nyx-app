import React, { useCallback, useState } from 'react'
import { BackHandler, Platform } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FAB, Portal } from 'react-native-paper'

// API 35+ draws edge-to-edge even when RN edgeToEdgeEnabled=false, and
// useSafeAreaInsets().bottom is often 0. Stack screens (theme/settings)
// have no tab bar, so FABs need this fallback to clear the gesture bar.
export const androidStackBottomInset = Platform.OS === 'android' ? 48 : 0

export const SafeBottom = ({
  children,
  min = 0,
}: {
  children: (bottom: number) => React.ReactNode
  min?: number
}) => {
  const { bottom } = useSafeAreaInsets()
  return <>{children(Math.max(bottom, min))}</>
}

type Props = {
  isVisible: boolean
  actions?: any[]
  iconOpen: string
  iconClosed?: string
  backgroundColor: string
  paddingBottom?: number
  onPress: Function
}
export const FabComponent = ({
  isVisible,
  actions = [],
  iconOpen,
  iconClosed = 'plus',
  backgroundColor,
  paddingBottom = 45,
  onPress,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const { bottom: insetBottom } = useSafeAreaInsets()
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
      // RN 0.79 removed BackHandler.removeEventListener; use the subscription instead
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
      return () => subscription.remove()
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
        style={{ paddingBottom: paddingBottom + insetBottom }}
      />
    </Portal>
  )
}
