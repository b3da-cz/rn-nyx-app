import React, { useEffect, useRef, useState } from 'react'
import { Animated, BackHandler, Linking, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Feather'
import { checkAndRecordAppStart, recordRatingPromptAction, Storage, t, Theme } from '../lib'
import { buildVersion } from '../../package.json'

const PLAY_STORE_URL = 'market://details?id=net.b3da.nnn'
const PLAY_STORE_WEB_URL = 'https://play.google.com/store/apps/details?id=net.b3da.nnn'

type Props = {
  theme: Theme
  onDismiss?: () => void
  onSupport?: () => void
}

export const RatingPromptComponent: React.FC<Props> = ({ theme, onDismiss, onSupport }) => {
  const [isMounted, setIsMounted] = useState(false)
  const anim = useRef(new Animated.Value(0)).current
  const insets = useSafeAreaInsets()
  const { colors, metrics: { fontSizes }, roundness } = theme

  const hide = () => {
    Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setIsMounted(false)
      onDismiss?.()
    })
  }

  const show = () => {
    setIsMounted(true)
    Animated.spring(anim, { toValue: 1, damping: 20, mass: 0.9, stiffness: 160, useNativeDriver: true }).start()
  }

  useEffect(() => {
    let timer: NodeJS.Timeout
    const init = async () => {
      const auth = await Storage.getAuth()
      const shouldShow = await checkAndRecordAppStart(buildVersion, !!auth?.username)
      if (shouldShow) timer = setTimeout(() => show(), 700)
    }
    init()
    return () => clearTimeout(timer)
  }, [])

  const handleRate = async () => {
    await recordRatingPromptAction('gplay', buildVersion)
    Linking.openURL(PLAY_STORE_URL).catch(() => Linking.openURL(PLAY_STORE_WEB_URL).catch(() => null))
    hide()
  }

  const handleSupport = async () => {
    await recordRatingPromptAction('support', buildVersion)
    hide()
    onSupport?.()
  }

  const handleLater = async () => {
    await recordRatingPromptAction('later', buildVersion)
    hide()
  }

  useEffect(() => {
    if (!isMounted) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLater()
      return true
    })
    return () => sub.remove()
  }, [isMounted])

  if (!isMounted) return null

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] })
  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] })
  const btnTextColor = theme.dark ? '#000' : '#fff'
  const btnBaseStyle = { height: 44, borderRadius: roundness * 2, alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const, marginBottom: 8 }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents={'box-none'}>
      <TouchableWithoutFeedback onPress={handleLater}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, transform: [{ translateY }] }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderTopWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            elevation: 12,
          }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.faded, alignSelf: 'center', marginBottom: 14, opacity: 0.4 }} />
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
            <Icon name={'star'} size={24} color={colors.primary} />
          </View>
          <Text style={{ fontSize: fontSizes.h2, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            {t('ratingPrompt.title')}
          </Text>
          <Text style={{ fontSize: fontSizes.p, color: colors.text, opacity: 0.85, lineHeight: 21, marginBottom: 18 }}>
            {t('ratingPrompt.message')}
          </Text>
          <TouchableRipple rippleColor={colors.ripple} onPress={handleRate} style={[btnBaseStyle, { backgroundColor: colors.primary }]}>
            <>
              <Icon name={'external-link'} size={16} color={btnTextColor} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: fontSizes.p, fontWeight: 'bold', color: btnTextColor }}>{t('ratingPrompt.rate')}</Text>
            </>
          </TouchableRipple>
          <TouchableRipple rippleColor={colors.ripple} onPress={handleSupport} style={[btnBaseStyle, { borderWidth: 1, borderColor: colors.primary }]}>
            <>
              <Icon name={'heart'} size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: fontSizes.p, fontWeight: 'bold', color: colors.primary }}>{t('ratingPrompt.support')}</Text>
            </>
          </TouchableRipple>
          <TouchableRipple rippleColor={colors.ripple} onPress={handleLater} style={{ height: 38, borderRadius: roundness * 2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: fontSizes.p, color: colors.faded }}>{t('ratingPrompt.later')}</Text>
          </TouchableRipple>
        </View>
      </Animated.View>
    </View>
  )
}
