import React, { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { formatTtlCountdown, useTheme } from '../../lib'

type Props = {
  expiresAt?: string | null
  onExpired?: () => void
}

export const LlmTtlBadge: React.FC<Props> = ({ expiresAt, onExpired }) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  const [now, setNow] = useState(() => Date.now())
  const fired = useRef(false)

  useEffect(() => {
    fired.current = false
  }, [expiresAt])

  useEffect(() => {
    if (!expiresAt) {
      return
    }
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  useEffect(() => {
    if (!expiresAt || fired.current) {
      return
    }
    const at = Date.parse(expiresAt)
    if (!Number.isNaN(at) && at <= now) {
      fired.current = true
      onExpired?.()
    }
  }, [expiresAt, now, onExpired])

  if (!expiresAt) {
    return null
  }
  const remaining = Date.parse(expiresAt) - now
  if (Number.isNaN(remaining) || remaining <= 0) {
    return null
  }

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 0,
        paddingHorizontal: 6,
        paddingVertical: 1,
        marginRight: 6,
      }}>
      <Text style={{ color: colors.primary, fontSize: fontSizes.small }}>{formatTtlCountdown(remaining)}</Text>
    </View>
  )
}
