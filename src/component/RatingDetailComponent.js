import React from 'react'
import { View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { TouchableRipple } from 'react-native-paper'
import { UserIconComponent } from './UserIconComponent'
import { useTheme } from '../lib'

export const RatingDetailComponent = ({
  postKey,
  ratings,
  ratingWidth,
  ratingHeight,
  isPositive,
  isDisabled = true,
  onPress,
  marginBottom = 0,
  marginTop = 0,
  borderColor,
  borderWidth,
}) => {
  const {
    colors,
    metrics: { blocks, line },
  } = useTheme()
  return (
    <TouchableRipple
      disabled={isDisabled}
      rippleColor={colors.ripple}
      style={{ marginBottom, marginTop, borderColor, borderWidth }}
      onPress={() => onPress()}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
        }}>
        <Icon
          name={isPositive ? 'thumbs-up' : 'thumbs-down'}
          size={ratingWidth / 1.25}
          color={isPositive ? 'green' : 'red'}
          style={{ marginHorizontal: blocks.medium, marginTop: blocks.medium }}
        />
        {ratings.map(r => (
          <UserIconComponent
            key={`${r.username}_${r.tag}_${postKey}`} //todo proper model
            username={r.username}
            width={ratingWidth}
            height={ratingHeight}
            borderWidth={line}
            marginRight={line}
            marginBottom={line}
          />
        ))}
      </View>
    </TouchableRipple>
  )
}
