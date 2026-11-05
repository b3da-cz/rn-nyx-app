import React, { useEffect, useRef } from 'react'
import { ActivityIndicator, LayoutAnimation, Text, View } from 'react-native'
import { ProgressBar } from 'react-native-paper'
import {
  FetchProgressState,
  fetchProgressRatio,
  formatNetworkBytes,
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
  const { done, total, ratio, networkBytes } = fetchProgressRatio(progress)
  const networkBytesLabel = formatNetworkBytes(networkBytes)
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
            count={total > 0 ? `${done}/${total}` : ''}
            percent={total > 0 ? `${pct} %` : ''}
            networkBytes={networkBytesLabel}
            progress={ratio}
            color={colors.primary}
            textColor={colors.text}
            detailColor={colors.faded}
            fontSize={fontSizes.p}
            detailSize={fontSizes.small}
            padding={blocks.medium}
            gap={blocks.small}
            emphasize
          />
          {detailed && steps.map(step => {
            const fraction = step.total > 0 ? `${Math.min(step.done, step.total)}/${step.total}` : ''
            const bar = step.total > 0 ? Math.min(Math.max(step.done, 0), step.total) / step.total : 0
            return (
              <ProgressRow
                key={step.id}
                label={stepLabel(step.id, step.label)}
                count={fraction}
                networkBytes={formatNetworkBytes(step.networkBytes)}
                progress={bar}
                detail={shortenFetchDetail(step.detail)}
                color={colors.primary}
                textColor={colors.text}
                detailColor={colors.faded}
                fontSize={fontSizes.p}
                detailSize={fontSizes.small}
                padding={blocks.medium}
                gap={blocks.small}
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
  count?: string
  percent?: string
  networkBytes?: string | null
  detail?: string
  progress: number
  color?: string
  textColor?: string
  detailColor?: string
  fontSize: number
  detailSize: number
  padding: number
  gap: number
  emphasize?: boolean
}

const ProgressRow = ({
  label,
  count,
  percent,
  networkBytes,
  detail,
  progress,
  color,
  textColor,
  detailColor,
  fontSize,
  detailSize,
  padding,
  gap,
  emphasize,
}: RowProps) => {
  const { colors } = useTheme()
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 0, marginBottom: gap, overflow: 'hidden' }}>
      <View
        style={{
          height: Math.ceil(fontSize * 1.35) + Math.ceil(detailSize * 1.35) + padding,
          paddingHorizontal: padding,
          justifyContent: 'center',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            numberOfLines={1}
            style={{ flex: 1, color: textColor, fontSize, fontWeight: emphasize ? '700' : '400' }}
          >
            {label}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: padding }}>
            {networkBytes ? (
              <Text style={{ color: detailColor, fontSize: detailSize, marginRight: 8 }}>
                {networkBytes}
              </Text>
            ) : null}
            {count ? (
              <Text style={{ color: textColor, fontSize: detailSize, fontWeight: '400' }}>{count}</Text>
            ) : null}
            {percent ? (
              <Text style={{ color: textColor, fontSize: detailSize, fontWeight: '700' }}>{`  ${percent}`}</Text>
            ) : null}
          </View>
        </View>
        <Text numberOfLines={1} style={{ color: detailColor, fontSize: detailSize, marginTop: 2, height: Math.ceil(detailSize * 1.35) }}>
          {detail || ' '}
        </Text>
      </View>
      <ProgressBar progress={progress} color={color} style={{ height: 4, borderRadius: 0 }} />
    </View>
  )
}
