import React, { FC, useEffect, useState } from 'react'
import { View } from 'react-native'
import { Button, Dialog, Portal, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Nyx, SharedData, Theme, t } from '../lib'
import { ShareClubPicker } from './ShareClubPicker'
import { SharePreviewBox } from './SharePreviewBox'
import { ErrorBoundary } from './ErrorBoundary'

export type ShareDestination = { type: 'mail' } | { type: 'discussion'; discussionId: number; discussionName?: string }

type Props = {
  visible: boolean
  sharedData: SharedData | null
  nyx: Nyx
  theme?: Theme
  onSelectDestination: (dest: ShareDestination, sharedData: SharedData) => void
  onDismiss: () => void
}

export const ShareTargetDialog: FC<Props> = ({ visible, sharedData, nyx, theme, onSelectDestination, onDismiss }) => {
  const [step, setStep] = useState<'target' | 'club'>('target')

  useEffect(() => {
    if (visible) {
      setStep('target')
    }
  }, [visible])

  if (!visible || !sharedData) return null

  const colors = theme?.colors || ({} as any)
  const fontSizes = theme?.metrics?.fontSizes || { h3: 16, p: 14, small: 12 }

  const handleDismiss = () => {
    setStep('target')
    onDismiss()
  }

  const renderTargetRow = (icon: string, iconColor: string, title: string, desc: string, onPress: () => void) => (
    <TouchableRipple
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.row || '#1a1b1d',
        borderLeftWidth: 3,
        borderLeftColor: iconColor,
        borderRadius: 0,
        marginBottom: 8,
      }}>
      <>
        <Icon name={icon} size={20} color={iconColor} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: fontSizes.p, fontWeight: 'bold' }}>{title}</Text>
          <Text style={{ color: colors.disabled, fontSize: fontSizes.small, marginTop: 2 }}>{desc}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={colors.disabled} />
      </>
    </TouchableRipple>
  )

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={handleDismiss}
        style={{ backgroundColor: colors.surface || '#222426', borderRadius: 4, marginHorizontal: 12, overflow: 'hidden' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card || '#2a2b2e',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border || '#333',
          }}>
          {step === 'club' ? (
            <TouchableRipple onPress={() => setStep('target')} style={{ marginRight: 10, padding: 4 }}>
              <Icon name="arrow-left" size={18} color={colors.text} />
            </TouchableRipple>
          ) : (
            <Icon name="share-2" size={18} color={colors.primary || '#d32f2f'} style={{ marginRight: 10 }} />
          )}
          <Text style={{ flex: 1, color: colors.text, fontSize: fontSizes.h3, fontWeight: 'bold' }}>
            {step === 'target' ? (t('share.title') || 'Sdílet do Nyxu') : (t('share.chooseClub') || 'Vyberte klub')}
          </Text>
          <TouchableRipple onPress={handleDismiss} style={{ padding: 4 }}>
            <Icon name="x" size={18} color={colors.disabled} />
          </TouchableRipple>
        </View>
        <Dialog.Content style={{ paddingHorizontal: 2, paddingTop: 2, paddingBottom: 0 }}>
          {step === 'target' ? (
            <View>
              <SharePreviewBox sharedData={sharedData} theme={theme} />
              {renderTargetRow('message-square', colors.primary || '#d32f2f', t('share.toClub') || 'Do klubu', t('share.toClubDesc') || 'Vybrat diskuzi', () => setStep('club'))}
              {renderTargetRow('mail', colors.secondary || '#4dabf7', t('share.toMail') || 'Do pošty', t('share.toMailDesc') || 'Nová zpráva', () => onSelectDestination({ type: 'mail' }, sharedData))}
            </View>
          ) : (
            <ErrorBoundary>
              <ShareClubPicker
                nyx={nyx}
                theme={theme}
                onSelectClub={club => {
                  setStep('target')
                  onSelectDestination({ type: 'discussion', discussionId: club.id, discussionName: club.name }, sharedData)
                }}
              />
            </ErrorBoundary>
          )}
        </Dialog.Content>
        <Dialog.Actions style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
          {step === 'club' ? (
            <Button onPress={() => setStep('target')} color={colors.disabled}>{t('back') || 'Zpět'}</Button>
          ) : (
            <Button onPress={handleDismiss} color={colors.disabled}>{t('cancel') || 'Zrušit'}</Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
