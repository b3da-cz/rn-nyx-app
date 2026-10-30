import React, { useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus, BackHandler, StyleSheet, View } from 'react-native'
import { Portal, Text } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { authenticateFingerprint, setSettingsCover, shouldRequireFingerprint, Storage, t, Theme } from '../lib'
import { ButtonComponent } from './ButtonComponent'

type Props = {
  ready: boolean
  enabled: boolean
  minutes: number
  cover: boolean
  theme: Theme
}

export const AppGuard = ({ ready, enabled, minutes, cover, theme }: Props) => {
  const [locked, setLocked] = useState(false)
  const [covered, setCovered] = useState(false)
  const [failed, setFailed] = useState(false)
  const checked = useRef(false)
  const authenticating = useRef(false)
  const backgroundAtRef = useRef<number | null>(null)

  const evaluateLock = (at: number | null) => {
    const need = shouldRequireFingerprint({ enabled: true, minutes, now: Date.now(), backgroundAt: at })
    setLocked(need)
    if (!need) {
      backgroundAtRef.current = null
      Storage.setFingerprintBackgroundAt(null)
    }
  }

  useEffect(() => {
    if (ready) setSettingsCover(cover)
  }, [ready, cover])

  useEffect(() => {
    if (!ready || checked.current) return
    checked.current = true
    if (enabled) Storage.getFingerprintBackgroundAt().then(evaluateLock)
  }, [ready, enabled, minutes])

  useEffect(() => {
    if (!enabled) {
      setLocked(false)
      setFailed(false)
      backgroundAtRef.current = null
      Storage.setFingerprintBackgroundAt(null)
    }
  }, [enabled])

  useEffect(() => {
    const onChange = async (next: AppStateStatus) => {
      if (authenticating.current) return
      if (next === 'inactive' || next === 'background') {
        if (cover) setCovered(true)
        if (next === 'background') {
          const now = Date.now()
          backgroundAtRef.current = now
          Storage.setFingerprintBackgroundAt(now)
        }
        return
      }
      if (next !== 'active') return
      setCovered(false)
      setSettingsCover(cover)
      if (!enabled) return
      const at = backgroundAtRef.current ?? (await Storage.getFingerprintBackgroundAt())
      if (at != null) evaluateLock(at)
    }
    const sub = AppState.addEventListener('change', onChange)
    return () => sub.remove()
  }, [enabled, minutes, cover])

  useEffect(() => {
    if (!locked) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => sub.remove()
  }, [locked])

  const unlock = async () => {
    if (authenticating.current) return
    authenticating.current = true
    setFailed(false)
    const ok = await authenticateFingerprint(t('profile.fingerprintPrompt'), t('cancel'))
    authenticating.current = false
    if (ok) {
      backgroundAtRef.current = null
      await Storage.setFingerprintBackgroundAt(null)
      setLocked(false)
      setFailed(false)
    } else {
      setFailed(true)
    }
  }

  useEffect(() => {
    if (locked && !covered && AppState.currentState === 'active') unlock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, covered])

  if (!covered && !locked) return null

  const { colors, metrics } = theme
  return (
    <Portal>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {locked && !covered && (
          <View style={{ alignItems: 'center', paddingHorizontal: metrics.blocks.large }}>
            <Icon name="fingerprint" size={72} color={colors.accent || colors.text} />
            <ButtonComponent
              label={t('profile.fingerprintUnlock')}
              theme={theme}
              color={colors.accent}
              fontSize={metrics.fontSizes.p}
              marginTop={metrics.blocks.large}
              onPress={unlock}
            />
            {failed && (
              <Text style={{ color: colors.faded || colors.text, fontSize: metrics.fontSizes.small, marginTop: metrics.blocks.medium }}>
                {t('profile.fingerprintFailed')}
              </Text>
            )}
          </View>
        )}
      </View>
    </Portal>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10000,
    elevation: 10000,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
