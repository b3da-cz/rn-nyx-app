import React from 'react'
import { View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { TouchableRipple } from 'react-native-paper'
import { UserIconComponent } from './UserIconComponent'
import { useTheme } from '../lib'

type Props = {
  postKey?: string
  ratings: any[]
  ratingWidth: number
  ratingHeight: number
  isPositive: boolean
  isDisabled?: boolean
  onPress?: Function
  marginBottom?: number
  marginTop?: number
  borderColor?: string
  borderWidth?: number
}
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
}: Props) => {
  const {
    colors,
    metrics: { blocks, line },
  } = useTheme()
  return (
    <TouchableRipple
      disabled={isDisabled}
      rippleColor={colors.ripple}
      style={{ marginBottom, marginTop, borderColor, borderWidth }}
      onPress={() => (typeof onPress === 'function' ? onPress() : null)}>
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
