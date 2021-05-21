import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { Dialog, Portal, Text } from 'react-native-paper'
import { Styling } from '../lib'

export const SpoilerComponent = ({ children, text, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <Text>
      <Portal>
        <Dialog visible={isVisible} onDismiss={() => setIsVisible(false)}>
          <Dialog.ScrollArea style={{ paddingLeft: 5, paddingRight: 5 }}>
            <ScrollView>
              <Text
                style={{
                  padding: Styling.metrics.block.medium,
                  fontSize: 15,
                  color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                }}>
                {text}
              </Text>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
      <Text onPress={() => setIsVisible(true)} style={{ fontSize: 15, color: Styling.colors.secondary }}>
        {`SPOILER `}
      </Text>
    </Text>
  )
}
