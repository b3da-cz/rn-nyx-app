import React from 'react'
import { View } from 'react-native'
import { Badge } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { UnreadContext, useTheme } from '../lib'

export const NotificationIconComponent = ({ color, isMail = false }) => {
  const { colors } = useTheme()
  return (
    <UnreadContext.Consumer>
      {({ messages, posts }) => {
        const unreads = isMail ? messages : posts
        return (
          <View>
            {unreads > 0 && (
              <Badge
                visible={true}
                size={15}
                style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  backgroundColor: isMail ? colors.secondary : colors.primary,
                }}>
                {unreads}
              </Badge>
            )}
            <Icon name={isMail ? 'mail' : 'activity'} size={14} color={color} />
          </View>
        )
      }}
    </UnreadContext.Consumer>
  )
}
