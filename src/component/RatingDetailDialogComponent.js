import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Dialog, Portal, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Styling } from '../lib'
import { UserRowComponent } from '../component'

export const RatingDetailDialogComponent = ({
  postKey,
  rating,
  ratingsPositive,
  ratingsNegative,
  myRating,
  isDarkMode,
  isDisabled = true,
  onPress,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const showRatings = () => {
    setIsVisible(true)
    onPress(true)
  }
  return (
    <View>
      <Portal>
        <Dialog visible={isVisible} onDismiss={() => setIsVisible(false)}>
          <Dialog.ScrollArea style={{ paddingLeft: 5, paddingRight: 5 }}>
            <ScrollView style={{ marginVertical: 5 }}>
              {ratingsPositive?.length > 0 && (
                <View>
                  <View style={Styling.groups.flexRowSpbCentered}>
                    <Icon
                      name={'thumbs-up'}
                      size={30}
                      color={'green'}
                      style={{ marginHorizontal: Styling.metrics.block.small, marginTop: Styling.metrics.block.small }}
                    />
                    <Text
                      style={{
                        color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                        fontSize: Styling.metrics.fontSize.medium,
                      }}>
                      {ratingsPositive.length}
                    </Text>
                  </View>
                  {ratingsPositive.map(r => (
                    <UserRowComponent
                      key={`${r.username}-${postKey}`}
                      user={r}
                      isDarkMode={isDarkMode}
                      isPressable={false}
                      marginBottom={0}
                      marginTop={Styling.metrics.block.xsmall}
                    />
                  ))}
                </View>
              )}
              {ratingsNegative?.length > 0 && (
                <View>
                  <View style={Styling.groups.flexRowSpbCentered}>
                    <Icon
                      name={'thumbs-down'}
                      size={30}
                      color={'red'}
                      style={{ marginHorizontal: Styling.metrics.block.small, marginTop: Styling.metrics.block.small }}
                    />
                    <Text
                      style={{
                        color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                        fontSize: Styling.metrics.fontSize.medium,
                      }}>
                      {ratingsNegative.length}
                    </Text>
                  </View>
                  {ratingsNegative.map(r => (
                    <UserRowComponent
                      key={`${r.username}-${postKey}`}
                      user={r}
                      isDarkMode={isDarkMode}
                      isPressable={false}
                      marginBottom={0}
                      marginTop={Styling.metrics.block.xsmall}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
      <TouchableRipple disabled={isDisabled} rippleColor={'rgba(18,146,180, 0.3)'} onPress={() => showRatings()}>
        <Text
          style={{
            paddingHorizontal: 5,
            paddingVertical: 10,
            color:
              myRating === 'positive'
                ? 'green'
                : myRating === 'negative' || myRating === 'negative_visible'
                ? 'red'
                : isDarkMode
                ? Styling.colors.lighter
                : Styling.colors.dark,
          }}>
          {rating}
        </Text>
      </TouchableRipple>
    </View>
  )
}
