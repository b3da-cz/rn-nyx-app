import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Text } from 'react-native-paper'
import {
  lumoQuotaBarRatio,
  lumoQuotaPercentLabel,
  LumoQuotaSnapshot,
  readLumoQuota,
  subscribeLumoQuota,
  t,
  useTheme,
} from '../../lib'

const emptySnapshot = (): LumoQuotaSnapshot => ({ rpdUsed: 0, rpmUsed: 0, rpdMax: 500, rpmMax: 20 })

export const LlmLumoQuota: React.FC = () => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const [snapshot, setSnapshot] = useState<LumoQuotaSnapshot>(emptySnapshot)

  useEffect(() => {
    let alive = true
    const pull = () => {
      readLumoQuota()
        .then(next => {
          if (alive) {
            setSnapshot(next)
          }
        })
        .catch(() => undefined)
    }
    pull()
    const unsubscribe = subscribeLumoQuota(next => {
      if (alive) {
        setSnapshot(next)
      }
    })
    const timer = setInterval(pull, 1000)
    return () => {
      alive = false
      unsubscribe()
      clearInterval(timer)
    }
  }, [])

  const rows = [
    {
      key: 'rpd',
      label: t('profile.llm.lumoRpd') || 'Požadavky za den',
      used: snapshot.rpdUsed,
      max: snapshot.rpdMax,
    },
    {
      key: 'rpm',
      label: t('profile.llm.lumoRpm') || 'Požadavky za minutu',
      used: snapshot.rpmUsed,
      max: snapshot.rpmMax,
    },
  ]

  return (
    <>
      {rows.map(row => {
        const ratio = row.max > 0 ? row.used / row.max : 0
        const fill = ratio >= 0.85 ? colors.error : ratio >= 0.6 ? colors.accent : colors.primary
        return (
          <View
            key={row.key}
            style={{
              backgroundColor: colors.surface,
              marginBottom: blocks.small,
              paddingHorizontal: blocks.medium,
              paddingTop: 8,
              paddingBottom: 8,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text numberOfLines={1} style={{ flex: 1, color: colors.faded, fontSize: fontSizes.small }}>
                {row.label}
              </Text>
              <Text style={{ color: colors.text, fontSize: fontSizes.small, fontWeight: '700' }}>
                {`${row.used} / ${row.max}`}
              </Text>
              <Text style={{ width: 44, textAlign: 'right', color: fill, fontSize: fontSizes.small }}>
                {lumoQuotaPercentLabel(row.used, row.max)}
              </Text>
            </View>
            <View style={{ height: 3, marginTop: 6, backgroundColor: colors.background }}>
              <View style={{ height: 3, width: `${lumoQuotaBarRatio(row.used, row.max) * 100}%`, backgroundColor: fill }} />
            </View>
          </View>
        )
      })}
    </>
  )
}
