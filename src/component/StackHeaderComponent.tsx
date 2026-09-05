import React from 'react'
import { Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { TouchableRipple } from 'react-native-paper'
import { Theme } from '../lib'

const HEADER_HEIGHT = 50

type Props = {
  navigation: any
  options: { title?: string }
  back?: { title?: string }
  theme: Theme
}

export const StackHeaderComponent = ({ navigation, options, back, theme }: Props) => (
  <View
    style={{
      height: HEADER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    }}>
    {back ? (
      <TouchableRipple
        onPress={() => navigation.goBack()}
        rippleColor={theme.colors.ripple}
        style={{
          width: HEADER_HEIGHT,
          height: HEADER_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name="arrow-left" size={theme.metrics.fontSizes.h2} color={theme.colors.text} />
      </TouchableRipple>
    ) : (
      <View style={{ width: 12 }} />
    )}
    <Text
      numberOfLines={1}
      style={{
        flex: 1,
        marginRight: 12,
        fontSize: theme.metrics.fontSizes.h3,
        color: theme.colors.text,
      }}>
      {options.title}
    </Text>
  </View>
)
