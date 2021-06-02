import React, { useState } from 'react'
import { LayoutAnimation, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { ButtonComponent, ButtonSquareComponent } from '../component'
import { LayoutAnimConf, Styling, useTheme, wait } from '../lib'

export const RatingFilterBarComponent = ({ onFilter }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [minimumRating, setMinimumRating] = useState(0)
  const [fromFriends, setFromFriends] = useState(false)

  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()

  const openFilter = () => {
    LayoutAnimation.configureNext(LayoutAnimConf.spring)
    setIsOpen(true)
  }
  const setFilter = async (minRating, isRatedByFriends) => {
    setMinimumRating(minRating)
    setFromFriends(isRatedByFriends)
    onFilter(minRating, isRatedByFriends)
    await wait(200)
    LayoutAnimation.configureNext(LayoutAnimConf.spring)
    setIsOpen(false)
  }
  const getColorForMinRating = rating => {
    return minimumRating === rating ? colors.text : colors.disabled
  }

  return (
    <TouchableRipple
      disabled={isOpen}
      rippleColor={colors.ripple}
      style={
        isOpen
          ? [
              Styling.groups.shadow,
              {
                backgroundColor: colors.background,
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
              Styling.groups.shadow,
              {
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 1,
                margin: 16,
                backgroundColor: colors.background,
                marginBottom: blocks.small,
                width: 42,
                height: 42,
                borderRadius: 25,
                opacity: 0.75,
              },
            ]
      }
      onPress={() => openFilter()}>
      <View>
        {!isOpen && (
          <Icon name={'thumbs-up'} size={16} color={fromFriends || minimumRating > 0 ? colors.accent : colors.text} />
        )}
        {isOpen && (
          <View style={{ flexDirection: 'row' }}>
            <ButtonSquareComponent
              icon={'users'}
              size={fontSizes.p}
              color={fromFriends ? colors.text : colors.disabled}
              onPress={() => setFilter(0, !fromFriends)}
            />
            <ButtonComponent
              label={'0'}
              color={getColorForMinRating(0)}
              backgroundColor={'inherit'}
              fontSize={fontSizes.p}
              width={50}
              onPress={() => setFilter(0, false)}
            />
            <ButtonComponent
              label={'+10'}
              color={getColorForMinRating(10)}
              backgroundColor={'inherit'}
              fontSize={fontSizes.p}
              width={50}
              onPress={() => setFilter(10, false)}
            />
            <ButtonComponent
              label={'+25'}
              color={getColorForMinRating(25)}
              backgroundColor={'inherit'}
              fontSize={fontSizes.p}
              width={50}
              onPress={() => setFilter(25, false)}
            />
            <ButtonComponent
              label={'+50'}
              color={getColorForMinRating(50)}
              backgroundColor={'inherit'}
              fontSize={fontSizes.p}
              width={50}
              onPress={() => setFilter(50, false)}
            />
            <ButtonComponent
              label={'+100'}
              color={getColorForMinRating(100)}
              backgroundColor={'inherit'}
              fontSize={fontSizes.p}
              width={65}
              onPress={() => setFilter(100, false)}
            />
            <ButtonComponent
              label={'+200'}
              color={getColorForMinRating(200)}
              backgroundColor={'inherit'}
              fontSize={fontSizes.p}
              width={65}
              onPress={() => setFilter(200, false)}
            />
          </View>
        )}
      </View>
    </TouchableRipple>
  )
}
