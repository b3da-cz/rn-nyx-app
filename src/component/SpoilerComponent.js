import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { Dialog, Portal, Text } from 'react-native-paper'
import { useTheme } from '../lib'

export const SpoilerComponent = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false)
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <Text>
      <Portal>
        <Dialog visible={isVisible} onDismiss={() => setIsVisible(false)}>
          <Dialog.ScrollArea style={{ paddingLeft: 5, paddingRight: 5 }}>
            <ScrollView>
              <Text
                style={{
                  padding: blocks.large,
                  fontSize: fontSizes.p,
                }}>
                {text}
              </Text>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
      <Text onPress={() => setIsVisible(true)} style={{ fontSize: fontSizes.p, color: colors.link }}>
        {`SPOILER `}
      </Text>
    </Text>
  )
}
