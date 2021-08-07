import React from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { UserRowComponent } from '../component'
import { useTheme } from '../lib'

type Props = {
  label: string
  count: number
  sides: number
  rolls: any[]
  canRoll: boolean
  onRoll: Function
}
export const DiceComponent = ({ label, count, sides, rolls, canRoll, onRoll }: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes, line },
  } = useTheme()
  return (
    <View style={{ paddingHorizontal: blocks.medium }}>
      <Text
        style={{
          padding: blocks.large,
          fontSize: fontSizes.h3,
        }}>
        {label}
      </Text>
      {rolls?.length > 0 &&
        rolls
          .filter(r => r?.user?.username)
          .map(r => (
            <UserRowComponent
              key={`${r.user.username}_roll`}
              user={r.user}
              isPressable={false}
              extraText={
                r.rolls?.length > 0
                  ? `${r.rolls.toString()} [${r.rolls.reduce((a, b) => Number(a) + Number(b))}]`
                  : undefined
              }
              marginBottom={0}
              marginTop={blocks.medium}
            />
          ))}
      {canRoll && (
        <TouchableRipple
          style={{ padding: blocks.large, borderWidth: line, borderColor: colors.accent }}
          rippleColor={colors.ripple}
          onPress={() => onRoll()}>
          <Text style={{ fontSize: fontSizes.h3, color: colors.accent, textAlign: 'center' }}>
            {`${count}d${sides}`}
          </Text>
        </TouchableRipple>
      )}
    </View>
  )
}
