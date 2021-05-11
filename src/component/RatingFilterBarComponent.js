import React, { useState } from 'react'
import { View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { ButtonComponent, ButtonSquareComponent } from '../component'
import { Styling, wait } from '../lib'

export const RatingFilterBarComponent = ({ isDarkMode, onFilter }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [minimumRating, setMinimumRating] = useState(0)
  const [fromFriends, setFromFriends] = useState(false)
  const setFilter = async (minRating, isRatedByFriends) => {
    setMinimumRating(minRating)
    setFromFriends(isRatedByFriends)
    onFilter(minRating, isRatedByFriends)
    await wait(200)
    setIsOpen(false)
  }
  const getColorForMinRating = rating => {
    return minimumRating === rating
      ? Styling.colors.accent
      : isDarkMode
      ? Styling.colors.lighter
      : Styling.colors.darker
  }

  return (
    <TouchableRipple
      disabled={isOpen}
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={
        isOpen
          ? [
              {
                backgroundColor: isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 1,
                height: 50,
                width: '100%',
              },
            ]
          : [
              Styling.groups.squareBtn,
              {
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 1,
                margin: 16,
                backgroundColor: isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
                marginBottom: Styling.metrics.block.xsmall,
                width: 48,
                height: 48,
                borderRadius: 25,
                opacity: 0.75,
              },
            ]
      }
      onPress={() => setIsOpen(!isOpen)}>
      <View>
        {!isOpen && (
          <Icon
            name={'thumbs-up'}
            size={16}
            color={
              fromFriends || minimumRating > 0
                ? Styling.colors.accent
                : isDarkMode
                ? Styling.colors.lighter
                : Styling.colors.darker
            }
          />
        )}
        {isOpen && (
          <View style={{ flexDirection: 'row' }}>
            <ButtonSquareComponent
              icon={'users'}
              color={fromFriends ? Styling.colors.accent : isDarkMode ? Styling.colors.lighter : Styling.colors.darker}
              onPress={() => setFilter(0, !fromFriends)}
            />
            <ButtonComponent
              label={'0'}
              color={getColorForMinRating(0)}
              backgroundColor={'inherit'}
              width={50}
              onPress={() => setFilter(0, false)}
            />
            <ButtonComponent
              label={'+10'}
              color={getColorForMinRating(10)}
              backgroundColor={'inherit'}
              width={50}
              onPress={() => setFilter(10, false)}
            />
            <ButtonComponent
              label={'+25'}
              color={getColorForMinRating(25)}
              backgroundColor={'inherit'}
              width={50}
              onPress={() => setFilter(25, false)}
            />
            <ButtonComponent
              label={'+50'}
              color={getColorForMinRating(50)}
              backgroundColor={'inherit'}
              width={50}
              onPress={() => setFilter(50, false)}
            />
            <ButtonComponent
              label={'+100'}
              color={getColorForMinRating(100)}
              backgroundColor={'inherit'}
              width={65}
              onPress={() => setFilter(100, false)}
            />
            <ButtonComponent
              label={'+200'}
              color={getColorForMinRating(200)}
              backgroundColor={'inherit'}
              width={65}
              onPress={() => setFilter(200, false)}
            />
          </View>
        )}
      </View>
    </TouchableRipple>
  )
}
