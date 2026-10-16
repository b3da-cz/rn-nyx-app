import React, { useEffect, useRef } from 'react'
import { ActivityIndicator, LayoutAnimation, Text, View } from 'react-native'
import { ProgressBar } from 'react-native-paper'
import {
  FetchProgressState,
  fetchProgressRatio,
  shortenFetchDetail,
  t,
  useTheme,
} from '../lib'

type Props = {
  progress?: FetchProgressState | null
  fill?: boolean
  detailed?: boolean
}

const stepKind = (id: string) => {
  const parts = id.split(':')
  return parts[parts.length - 1] || id
}

const stepLabel = (id: string, label?: string) => {
  if (label) {
    return label
  }
  const kind = stepKind(id)
  return t(`load.${kind}`) || kind
}

export const FetchProgressComponent = ({ progress, fill = true, detailed = true }: Props) => {
  const theme = useTheme()
  const steps = progress?.steps || []
  const { done, total, ratio } = fetchProgressRatio(progress)
  const shown = useRef(0)
  useEffect(() => {
    if (steps.length > shown.current) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    }
    shown.current = steps.length
  }, [steps.length])
  const colors = theme?.colors || {}
  const blocks = theme?.metrics?.blocks || { medium: 8, small: 4 }
  const fontSizes = theme?.metrics?.fontSizes || { p: 15, small: 12 }
  const pct = Math.round(ratio * 100)
  return (
    <View style={{ flex: fill ? 1 : undefined, backgroundColor: colors.background }}>
      {steps.length > 0 && (
        <View>
          <ProgressRow
            label={t('load.overall')}
            trailing={total > 0 ? `${done}/${total} · ${pct} %` : ''}
            progress={ratio}
            color={colors.primary}
            textColor={colors.text}
            detailColor={colors.faded}
            borderColor={colors.border}
            fontSize={fontSizes.p}
            detailSize={fontSizes.small}
            padding={blocks.medium}
            emphasize
          />
          {detailed && steps.map(step => {
            const fraction = step.total > 0 ? `${Math.min(step.done, step.total)}/${step.total}` : ''
            const bar = step.total > 0 ? Math.min(Math.max(step.done, 0), step.total) / step.total : 0
            return (
              <ProgressRow
                key={step.id}
                label={stepLabel(step.id, step.label)}
                trailing={fraction}
                detail={shortenFetchDetail(step.detail)}
                progress={bar}
                color={colors.primary}
                textColor={colors.text}
                detailColor={colors.faded}
                borderColor={colors.border}
                fontSize={fontSizes.p}
                detailSize={fontSizes.small}
                padding={blocks.medium}
              />
            )
          })}
        </View>
      )}
      {fill && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  )
}

type RowProps = {
  label: string
  trailing: string
  detail?: string
  progress: number
  color?: string
  textColor?: string
  detailColor?: string
  borderColor?: string
  fontSize: number
  detailSize: number
  padding: number
  emphasize?: boolean
}

const ProgressRow = ({
  label,
  trailing,
  detail,
  progress,
  color,
  textColor,
  detailColor,
  borderColor,
  fontSize,
  detailSize,
  padding,
  emphasize,
}: RowProps) => (
  <View
    style={{
      paddingHorizontal: padding,
      paddingTop: padding,
      paddingBottom: emphasize ? padding : padding / 2,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      borderLeftWidth: emphasize ? 3 : 0,
      borderLeftColor: color,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text numberOfLines={1} style={{ flex: 1, color: textColor, fontSize, fontWeight: emphasize ? '700' : '400' }}>
        {label}
      </Text>
      {trailing ? (
        <Text style={{ color: detailColor, fontSize: detailSize, marginLeft: padding }}>{trailing}</Text>
      ) : null}
    </View>
    {detail ? (
      <Text numberOfLines={1} style={{ color: detailColor, fontSize: detailSize, marginTop: 2 }}>
        {detail}
      </Text>
    ) : null}
    <ProgressBar progress={progress} color={color} style={{ height: emphasize ? 4 : 3, marginTop: 6 }} />
  </View>
)
