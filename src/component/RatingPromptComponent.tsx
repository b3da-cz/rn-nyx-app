import React, { useEffect, useState } from 'react'
import { Linking, View } from 'react-native'
import { Dialog, Portal, Text } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { ButtonComponent } from './ButtonComponent'
import {
  checkAndRecordAppStart,
  recordRatingPromptAction,
  Storage,
  Styling,
  t,
  Theme,
} from '../lib'
import { buildVersion } from '../../package.json'

const PLAY_STORE_URL = 'market://details?id=net.b3da.nnn'
const PLAY_STORE_WEB_URL = 'https://play.google.com/store/apps/details?id=net.b3da.nnn'

type Props = {
  theme: Theme
  onDismiss?: () => void
  onSupport?: () => void
}

export const RatingPromptComponent: React.FC<Props> = ({ theme, onDismiss, onSupport }) => {
  const [isVisible, setIsVisible] = useState(false)
  const {
    colors,
    metrics: { blocks, fontSizes },
    roundness,
  } = theme

  useEffect(() => {
    let timer: NodeJS.Timeout
    const init = async () => {
      const auth = await Storage.getAuth()
      const shouldShow = await checkAndRecordAppStart(buildVersion, !!auth?.username)
      if (shouldShow) timer = setTimeout(() => setIsVisible(true), 700)
    }
    init()
    return () => clearTimeout(timer)
  }, [])

  const handleRate = async () => {
    setIsVisible(false)
    await recordRatingPromptAction('gplay', buildVersion)
    Linking.openURL(PLAY_STORE_URL).catch(() => Linking.openURL(PLAY_STORE_WEB_URL).catch(() => null))
    onDismiss?.()
  }

  const handleSupport = async () => {
    setIsVisible(false)
    await recordRatingPromptAction('support', buildVersion)
    onDismiss?.()
    onSupport?.()
  }

  const handleLater = async () => {
    setIsVisible(false)
    await recordRatingPromptAction('later', buildVersion)
    onDismiss?.()
  }

  if (!isVisible) return null

  const btnTextColor = theme.dark ? '#000' : '#fff'

  return (
    <Portal>
      <Dialog
        visible={isVisible}
        onDismiss={handleLater}
        style={{
          backgroundColor: colors.surface,
          borderRadius: roundness,
          marginHorizontal: blocks.medium,
        }}>
        <View
          style={[
            Styling.groups.flexRowCentered,
            { paddingHorizontal: blocks.large, paddingTop: blocks.large, paddingBottom: blocks.small },
          ]}>
          <Icon name={'star'} size={fontSizes.h1} color={colors.primary} style={{ marginRight: blocks.medium }} />
          <Text style={{ fontSize: fontSizes.h3, fontWeight: '700', color: colors.text, flex: 1 }}>
            {t('ratingPrompt.title')}
          </Text>
        </View>
        <Dialog.Content style={{ paddingHorizontal: blocks.large, paddingBottom: blocks.medium }}>
          <Text style={{ fontSize: fontSizes.p, color: colors.text, lineHeight: 22, opacity: 0.9 }}>
            {t('ratingPrompt.message')}
          </Text>
        </Dialog.Content>
        <Dialog.Actions
          style={{
            flexDirection: 'column',
            alignItems: 'stretch',
            paddingHorizontal: blocks.large,
            paddingBottom: blocks.medium,
          }}>
          <ButtonComponent
            label={t('ratingPrompt.rate')}
            icon={'external-link'}
            theme={theme}
            borderRadius={roundness}
            color={btnTextColor}
            backgroundColor={colors.primary}
            fontSize={fontSizes.p}
            lineHeight={42}
            marginBottom={blocks.small}
            onPress={handleRate}
          />
          <ButtonComponent
            label={t('ratingPrompt.support')}
            icon={'heart'}
            theme={theme}
            borderRadius={roundness}
            color={colors.primary}
            borderColor={colors.primary}
            borderWidth={1}
            fontSize={fontSizes.p}
            lineHeight={42}
            marginBottom={blocks.small}
            onPress={handleSupport}
          />
          <ButtonComponent
            label={t('ratingPrompt.later')}
            theme={theme}
            borderRadius={roundness}
            color={colors.faded}
            fontSize={fontSizes.p}
            lineHeight={36}
            onPress={handleLater}
          />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
