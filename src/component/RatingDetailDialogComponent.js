import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Dialog, Portal, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Styling, useTheme } from '../lib'
import { UserRowComponent } from '../component'

export const RatingDetailDialogComponent = ({
  postKey,
  rating,
  ratingsPositive,
  ratingsNegative,
  myRating,
  isDisabled = true,
  onPress,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const theme = useTheme()
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = theme
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
                    <Icon name={'thumbs-up'} size={fontSizes.h1} color={'green'} />
                    <Text style={{ fontSize: fontSizes.p }}>{ratingsPositive.length}</Text>
                  </View>
                  {ratingsPositive.map(r => (
                    <UserRowComponent
                      key={`${r.username}-${postKey}`}
                      user={r}
                      theme={theme}
                      isPressable={false}
                      marginBottom={0}
                      marginTop={blocks.small}
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
                      style={{ marginHorizontal: blocks.medium, marginTop: blocks.medium }}
                    />
                    <Text style={{ fontSize: fontSizes.h3 }}>{ratingsNegative.length}</Text>
                  </View>
                  {ratingsNegative.map(r => (
                    <UserRowComponent
                      key={`${r.username}-${postKey}`}
                      user={r}
                      theme={theme}
                      isPressable={false}
                      marginBottom={0}
                      marginTop={blocks.small}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
      <TouchableRipple disabled={isDisabled} rippleColor={colors.ripple} onPress={() => showRatings()}>
        <Text
          style={{
            paddingHorizontal: 5,
            paddingVertical: 10,
            width: 45,
            textAlign: 'right',
            color:
              myRating === 'positive'
                ? 'green'
                : myRating === 'negative' || myRating === 'negative_visible'
                ? 'red'
                : colors.text,
          }}>
          {rating}
        </Text>
      </TouchableRipple>
    </View>
  )
}
