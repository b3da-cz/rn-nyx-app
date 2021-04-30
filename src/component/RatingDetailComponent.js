import React from 'react'
import { Styling } from '../lib'
import { View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { TouchableRipple } from 'react-native-paper'
import { UserIconComponent } from './UserIconComponent'

export const RatingDetailComponent = ({
  ratings,
  ratingWidth,
  ratingHeight,
  isPositive,
  isDarkMode,
  isDisabled = true,
  onPress,
  backgroundColor = Styling.colors.black,
  marginBottom = 0,
  marginTop = 0,
  borderColor = Styling.colors.secondary,
  borderWidth = 0,
}) => {
  return (
    <TouchableRipple
      disabled={isDisabled}
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={[
        Styling.groups.themeComponent(isDarkMode),
        { marginBottom, marginTop, borderColor, borderWidth, backgroundColor },
      ]}
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
          size={ratingWidth}
          color={isPositive ? 'green' : 'red'}
          style={{ marginHorizontal: Styling.metrics.block.small, marginTop: Styling.metrics.block.small }}
        />
        {ratings.map(r => (
          <UserIconComponent
            key={`${r.username}${r.tag}`}
            username={r.username}
            width={ratingWidth}
            height={ratingHeight}
            borderWidth={1}
            marginRight={1}
          />
        ))}
      </View>
    </TouchableRipple>
  )
}
