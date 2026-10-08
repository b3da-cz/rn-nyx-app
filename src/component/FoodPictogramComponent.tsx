import React from 'react'
import { View } from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

type Props = {
  name: string
  color: string
  size?: number
}

export const FoodPictogramComponent: React.FC<Props> = ({ name, color, size = 28 }) => {
  if (name === 'sushi') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: (size * 0.85) / 2,
            borderWidth: Math.max(2, size * 0.12),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: (size * 0.3) / 2,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    )
  }

  if (name === 'vegeburger') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={'hamburger'} size={size} color={color} />
        <View style={{ position: 'absolute', top: -2, right: -2 }}>
          <MaterialCommunityIcons name={'sprout'} size={size * 0.55} color={color} />
        </View>
      </View>
    )
  }

  if (name === 'pizza_vegetariana') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={'pizza'} size={size} color={color} />
        <View style={{ position: 'absolute', top: -2, right: -2 }}>
          <MaterialCommunityIcons name={'sprout'} size={size * 0.55} color={color} />
        </View>
      </View>
    )
  }

  if (name === 'pizza_prosciutto_crudo') {
    return <MaterialCommunityIcons name={'pizza'} size={size} color={color} />
  }

  if (name === 'burger') {
    return <MaterialCommunityIcons name={'hamburger'} size={size} color={color} />
  }

  if (name === 'pasta') {
    return <MaterialCommunityIcons name={'pasta'} size={size} color={color} />
  }

  if (name === 'coffee') {
    return <MaterialCommunityIcons name={'coffee'} size={size} color={color} />
  }

  return <MaterialCommunityIcons name={'food'} size={size} color={color} />
}
