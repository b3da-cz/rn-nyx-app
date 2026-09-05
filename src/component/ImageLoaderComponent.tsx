import React, { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import { useTheme } from '../lib'

type Props = {
  color?: string
  size?: number
}
export const ImageLoaderComponent = ({ color, size = 10 }: Props) => {
  const { colors } = useTheme()
  const dotColor = color || colors.primary
  const d1 = useRef(new Animated.Value(0.3)).current
  const d2 = useRef(new Animated.Value(0.3)).current
  const d3 = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    const dots = [d1, d2, d3]
    const anims = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(v, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    )
    anims.forEach(a => a.start())
    return () => anims.forEach(a => a.stop())
  }, [d1, d2, d3])
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {[d1, d2, d3].map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            marginHorizontal: size / 2,
            backgroundColor: dotColor,
            opacity: v,
            transform: [{ scale: v }],
          }}
        />
      ))}
    </View>
  )
}
