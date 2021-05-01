import React from 'react'
import { Styling } from '../lib'
import Icon from 'react-native-vector-icons/Feather'
import { TouchableRipple } from 'react-native-paper'

export const ButtonSquareComponent = ({
  icon,
  isDisabled,
  onPress,
  onLongPress,
  color = Styling.colors.lighter,
  backgroundColor,
  size = Styling.metrics.fontSize.xxlarge,
  marginBottom = 0,
  marginTop = 0,
  borderColor = Styling.colors.secondary,
  borderWidth = 0,
}) => {
  return (
    <TouchableRipple
      disabled={isDisabled}
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={[Styling.groups.squareBtn, { backgroundColor, marginBottom, marginTop, borderColor, borderWidth }]}
      onPress={() => onPress()}
      onLongPress={() => (typeof onLongPress === 'function' ? onLongPress() : null)}>
      <Icon name={icon} size={size} color={color} />
    </TouchableRipple>
  )
}
