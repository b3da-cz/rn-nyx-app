import React from 'react'
import { Switch, View } from 'react-native'
import { Button, Text } from 'react-native-paper'
import { useTheme } from '../../lib'

type Props = {
  label: string
  value?: string
  valueColor?: string
  toggle?: boolean
  onToggle?: (val: boolean) => void
  onPress?: () => void
  children?: React.ReactNode
  progressRatio?: number
  progressColor?: string
}

// Same look as the events filter rows: surface strip, faded label on the left, value / control on the right.
export const LlmFormRow = ({
  label,
  value,
  valueColor,
  toggle,
  onToggle,
  onPress,
  children,
  progressRatio,
  progressColor,
}: Props) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const isToggle = typeof onToggle === 'function'
  const hasProgress = progressRatio != null && Number.isFinite(progressRatio)
  const clampedRatio = hasProgress ? Math.min(1, Math.max(0, progressRatio!)) : 0
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 40,
        backgroundColor: colors.surface,
        marginBottom: blocks.small,
        paddingLeft: blocks.medium,
        paddingRight: isToggle ? blocks.medium : 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
      <Text
        numberOfLines={1}
        style={{ color: colors.faded, fontSize: fontSizes.p, marginRight: blocks.medium, flexShrink: 0 }}
        onPress={isToggle ? () => onToggle!(!toggle) : onPress}>
        {label}
      </Text>
      {isToggle ? (
        <Switch
          thumbColor={toggle ? colors.primary : colors.disabled}
          onValueChange={val => onToggle!(val)}
          value={!!toggle}
        />
      ) : children ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>{children}</View>
      ) : (
        <Button
          onPress={onPress}
          disabled={!onPress}
          uppercase={false}
          color={valueColor || colors.text}
          style={{ flexShrink: 1 }}>
          {`${value ?? ''}`}
        </Button>
      )}
      {hasProgress && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            backgroundColor: colors.border,
          }}>
          <View
            style={{
              height: 2,
              width: `${clampedRatio * 100}%`,
              backgroundColor: progressColor || colors.primary,
            }}
          />
        </View>
      )}
    </View>
  )
}
