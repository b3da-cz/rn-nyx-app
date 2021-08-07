import React from 'react'
import { ScrollView, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { ImageComponent } from './ImageComponent'
import { useTheme } from '../lib'

type Props = {
  action: string
  title?: string
  summary?: string
  shipping?: string
  images: any[]
  repliesCount?: number
  location: string
  price: number
  updated: string
  isActive?: boolean
  isDetail?: boolean
  onPress?: Function
  onImage: Function
}
export const AdvertisementComponent = ({
  action,
  title,
  summary,
  shipping,
  images,
  repliesCount,
  location,
  price,
  updated,
  isActive,
  isDetail,
  onPress,
  onImage,
}: Props) => {
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
      <TouchableRipple
        disabled={!isActive}
        rippleColor={colors.ripple}
        onPress={() => (typeof onPress === 'function' ? onPress() : null)}>
        <View style={{ paddingHorizontal: blocks.medium, paddingBottom: blocks.medium }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: fontSizes.h3 }}>{action}</Text>
            <Text style={{ fontSize: fontSizes.p, textAlign: 'right' }}>
              {isDetail ? updated : repliesCount && repliesCount > 0 ? repliesCount : ''}
            </Text>
          </View>
          <Text style={{ fontSize: fontSizes.p }}>{title}</Text>
          <Text style={{ fontSize: fontSizes.p }}>{summary}</Text>
          {shipping && shipping.length > 0 && (
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
