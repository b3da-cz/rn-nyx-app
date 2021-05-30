import React from 'react'
import { ScrollView, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { ImageComponent } from './ImageComponent'
import { useTheme } from '../lib'

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
  onPress,
  onImage,
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
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
              onPress={() => onImage(img)}
            />
          ))}
      </ScrollView>
      <TouchableRipple disabled={!isActive} rippleColor={colors.ripple} onPress={() => onPress()}>
        <View style={{ paddingHorizontal: blocks.medium, paddingBottom: blocks.medium }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: fontSizes.h3 }}>{action}</Text>
            <Text style={{ fontSize: fontSizes.p, textAlign: 'right' }}>
              {isDetail ? updated : repliesCount > 0 ? repliesCount : ''}
            </Text>
          </View>
          <Text style={{ fontSize: fontSizes.p }}>{title}</Text>
          <Text style={{ fontSize: fontSizes.p }}>{summary}</Text>
          {shipping?.length > 0 && (
            <Text
              style={{
                fontSize: fontSizes.p,
                paddingTop: blocks.medium,
              }}>
              {shipping}
            </Text>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: blocks.medium }}>
            <Text style={{ fontSize: fontSizes.p }}>{location}</Text>
            <Text style={{ fontSize: fontSizes.p, textAlign: 'right' }}>{price}</Text>
          </View>
        </View>
      </TouchableRipple>
    </View>
  )
}
