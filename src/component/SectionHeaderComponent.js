import React from 'react'
import { Text, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Styling } from '../lib'

export const SectionHeaderComponent = ({ title, icon, isDarkMode, isPressable, onPress }) => {
  return (
    <TouchableRipple
      disabled={!isPressable}
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={{
        width: '100%',
        backgroundColor: isDarkMode ? Styling.colors.dark : Styling.colors.light,
        marginBottom: Styling.metrics.block.xsmall,
      }}
      onPress={() => onPress()}>
      <View style={[Styling.groups.flexRowSpbCentered, { paddingHorizontal: Styling.metrics.block.small }]}>
        <Text
          style={{
            fontSize: Styling.metrics.fontSize.medium,
            color: isDarkMode ? Styling.colors.lighter : Styling.colors.black,
            paddingVertical: 6,
          }}>
          {title}
        </Text>
        {icon?.length > 0 && (
          <Icon name={icon} size={14} color={isDarkMode ? Styling.colors.lighter : Styling.colors.black} />
        )}
      </View>
    </TouchableRipple>
  )
}
