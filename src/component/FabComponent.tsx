import React, { useCallback, useState } from 'react'
import { BackHandler } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FAB, Portal } from 'react-native-paper'

export const SafeBottom = ({ children }: { children: (bottom: number) => React.ReactNode }) => {
  const { bottom } = useSafeAreaInsets()
  return <>{children(bottom)}</>
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
