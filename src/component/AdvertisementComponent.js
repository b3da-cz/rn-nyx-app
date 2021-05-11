import React from 'react'
import { Styling } from '../lib'
import { Text, ScrollView, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import { ImageComponent } from './ImageComponent'

export const AdvertisementComponent = ({
  action,
  title,
  summary,
  shipping,
  description,
  images,
  repliesCount,
  location,
  price,
  updated,
  isActive,
  isDetail,
  isDarkMode,
  onPress,
  onImage,
}) => {
  const imgW = isDetail ? undefined : 100
  const imgH = isDetail ? 200 : 100
  return (
    <View>
      <ScrollView horizontal={true}>
        {images?.length > 0 &&
          images.map(img => (
            <ImageComponent
              key={img.url}
              src={img.url}
              width={imgW}
              height={imgH}
              useExactSize={!isDetail}
              backgroundColor={isDarkMode ? Styling.colors.black : Styling.colors.white}
              onPress={() => onImage(img)}
            />
          ))}
      </ScrollView>
      <TouchableRipple
        disabled={!isActive}
        rippleColor={'rgba(18,146,180, 0.3)'}
        style={[Styling.groups.themeComponent(isDarkMode), { width: '100%' }]}
        onPress={() => onPress()}>
        <View style={{ paddingHorizontal: Styling.metrics.block.small, paddingBottom: Styling.metrics.block.small }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text
              style={{
                color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                fontSize: Styling.metrics.fontSize.xlarge,
              }}>
              {action}
            </Text>
            <Text
              style={{
                color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                fontSize: Styling.metrics.fontSize.medium,
                textAlign: 'right',
              }}>
              {isDetail ? updated : repliesCount > 0 ? repliesCount : ''}
            </Text>
          </View>
          <Text
            style={{
              color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
              fontSize: Styling.metrics.fontSize.medium,
            }}>
            {title}
          </Text>
          <Text
            style={{
              color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
              fontSize: Styling.metrics.fontSize.medium,
            }}>
            {summary}
          </Text>
          {shipping?.length > 0 && (
            <Text
              style={{
                color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                fontSize: Styling.metrics.fontSize.medium,
                paddingTop: Styling.metrics.block.small,
              }}>
              {shipping}
            </Text>
          )}
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: Styling.metrics.block.small }}>
            <Text
              style={{
                color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                fontSize: Styling.metrics.fontSize.medium,
              }}>
              {location}
            </Text>
            <Text
              style={{
                color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                fontSize: Styling.metrics.fontSize.medium,
                textAlign: 'right',
              }}>
              {price}
            </Text>
          </View>
        </View>
      </TouchableRipple>
    </View>
  )
}
