import React, { useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus, BackHandler, View } from 'react-native'
import { Portal, Text } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { authenticateFingerprint, setAppSecure, shouldRequireFingerprint, Storage, t, Theme } from '../lib'
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
  const ignoreNextActive = useRef(false)

  useEffect(() => {
    if (!ready) {
      return
    }
    setAppSecure(cover)
  }, [ready, cover])

  useEffect(() => {
    if (!ready || checked.current) {
      return
    }
    checked.current = true
    if (!enabled) {
      return
    }
    Storage.getFingerprintBackgroundAt().then(at => {
      setLocked(
        shouldRequireFingerprint({
          enabled: true,
          minutes,
          now: Date.now(),
          backgroundAt: at,
        }),
      )
    })
  }, [ready, enabled, minutes])

  useEffect(() => {
    if (!enabled) {
      setLocked(false)
      setFailed(false)
    }
  }, [enabled])

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (authenticating.current) {
        return
      }
      if (next === 'inactive' || next === 'background') {
        if (cover) {
          setCovered(true)
        }
        // Shade and the fingerprint sheet also go inactive. The grace clock
        // starts only once the app is actually in the background.
        if (next === 'background') {
          Storage.setFingerprintBackgroundAt(Date.now())
        }
        return
      }
      if (next !== 'active') {
        return
      }
      setCovered(false)
      setAppSecure(cover)
      if (ignoreNextActive.current) {
        ignoreNextActive.current = false
        return
      }
      if (!enabled) {
        return
      }
      Storage.getFingerprintBackgroundAt().then(at => {
        if (at == null) {
          return
        }
        setLocked(
          shouldRequireFingerprint({
            enabled: true,
            minutes,
            now: Date.now(),
            backgroundAt: at,
          }),
        )
      })
    }
    const sub = AppState.addEventListener('change', onChange)
    return () => sub.remove()
  }, [enabled, minutes, cover])

  useEffect(() => {
    if (!locked) {
      return
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => sub.remove()
  }, [locked])

  const unlock = async () => {
    if (authenticating.current) {
      return
    }
    authenticating.current = true
    setFailed(false)
    const ok = await authenticateFingerprint(t('profile.fingerprintPrompt'), t('cancel'))
    authenticating.current = false
    if (ok) {
      ignoreNextActive.current = true
      await Storage.setFingerprintBackgroundAt(null)
      setLocked(false)
      setFailed(false)
      return
    }
    setFailed(true)
  }

  useEffect(() => {
    if (locked && !covered && AppState.currentState === 'active') {
      unlock()
    }
    // prompt once when the lock is on screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, covered])

  if (!covered && !locked) {
    return null
  }

  const { colors, metrics } = theme
  return (
    <Portal>
    <View
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 10000,
        elevation: 10000,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
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
            <Text
              style={{
                color: colors.faded || colors.text,
                fontSize: metrics.fontSizes.small,
                marginTop: metrics.blocks.medium,
              }}>
              {t('profile.fingerprintFailed')}
            </Text>
          )}
        </View>
      )}
    </View>
    </Portal>
  )
}
