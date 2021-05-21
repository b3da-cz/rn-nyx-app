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
  const color =
    !isDetail && !isActive ? Styling.colors.medium : isDarkMode ? Styling.colors.lighter : Styling.colors.darker
  const fontSize = Styling.metrics.fontSize.medium
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
            <Text style={{ color, fontSize: Styling.metrics.fontSize.xlarge }}>{action}</Text>
            <Text style={{ color, fontSize, textAlign: 'right' }}>
              {isDetail ? updated : repliesCount > 0 ? repliesCount : ''}
            </Text>
          </View>
          <Text style={{ color, fontSize }}>{title}</Text>
          <Text style={{ color, fontSize }}>{summary}</Text>
          {shipping?.length > 0 && (
            <Text
              style={{
                color,
                fontSize,
                paddingTop: Styling.metrics.block.small,
              }}>
              {shipping}
            </Text>
          )}
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: Styling.metrics.block.small }}>
            <Text style={{ color, fontSize }}>{location}</Text>
            <Text style={{ color, fontSize, textAlign: 'right' }}>{price}</Text>
          </View>
        </View>
      </TouchableRipple>
    </View>
  )
}
