import React, { FC, useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Button, Dialog, Portal, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import {
  CustomReminderList,
  getCustomReminderLists,
  subscribeCustomReminders,
  t,
  Theme,
  useTheme,
} from '../lib'

type Props = {
  visible: boolean
  post: any
  mailMode?: boolean
  theme?: Theme
  onDismiss: () => void
  onSaveToNyx: () => void
  onSaveToCustomList: (listId: string) => void
}

export const ReminderTargetDialog: FC<Props> = ({
  visible,
  post,
  mailMode,
  theme: themeProp,
  onDismiss,
  onSaveToNyx,
  onSaveToCustomList,
}) => {
  const hookTheme = useTheme()
  const theme = themeProp || hookTheme
  const colors = theme?.colors || ({} as any)
  const fontSizes = theme?.metrics?.fontSizes || { h3: 16, p: 14, small: 12 }
  const [lists, setLists] = useState<CustomReminderList[]>([])

  useEffect(() => {
    if (!visible) return
    let active = true
    getCustomReminderLists().then(loaded => {
      if (active) setLists(loaded)
    })
    const unsub = subscribeCustomReminders(() => {
      getCustomReminderLists().then(loaded => {
        if (active) setLists(loaded)
      })
    })
    return () => {
      active = false
      unsub()
    }
  }, [visible])

  if (!visible || !post) return null

  const isMail = Boolean(mailMode || post.location === 'mail' || !post.discussion_id)
  const nyxLabel = isMail
    ? t('reminders.saveToNyxMail') || 'Uložit do pošty na Nyxu'
    : t('reminders.saveToNyxDiscussion') || 'Uložit do diskuzí na Nyxu'

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{
          backgroundColor: colors.surface || '#222426',
          borderRadius: 4,
          marginHorizontal: 12,
          overflow: 'hidden',
          maxHeight: '85%',
        }}>
        {/* Header */}
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
          <Icon name="bell" size={18} color={colors.primary || '#d32f2f'} style={{ marginRight: 10 }} />
          <Text style={{ flex: 1, color: colors.text, fontSize: fontSizes.h3, fontWeight: 'bold' }}>
            {t('reminders.targetDialogTitle') || 'Přidat do připomínek'}
          </Text>
          <TouchableRipple onPress={onDismiss} style={{ padding: 4 }}>
            <Icon name="x" size={18} color={colors.disabled || '#888'} />
          </TouchableRipple>
        </View>

        <Dialog.Content style={{ paddingHorizontal: 2, paddingTop: 2, paddingBottom: 0 }}>
          {/* Top Primary Button: Nyx Reminders */}
          <TouchableRipple
            onPress={onSaveToNyx}
            rippleColor={colors.ripple}
            style={{
              backgroundColor: colors.primary || '#d32f2f',
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
            }}>
            <>
              <Icon name="bell" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontSize: fontSizes.p, fontWeight: '700' }}>
                {nyxLabel}
              </Text>
            </>
          </TouchableRipple>

          {/* Section Divider / Label */}
          <View
            style={{
              backgroundColor: colors.card || '#2a2b2e',
              height: 26,
              justifyContent: 'center',
              paddingHorizontal: 8,
              marginBottom: 2,
            }}>
            <Text
              style={{
                color: colors.faded || '#888',
                fontSize: 11,
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}>
              {t('reminders.saveToCustom') || 'Uložit do vlastního seznamu'}
            </Text>
          </View>

          {/* Custom Lists List or Empty State */}
          {lists.length > 0 ? (
            <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
              {lists.map(list => {
                const count = list.posts?.length || 0
                return (
                  <TouchableRipple
                    key={list.id}
                    onPress={() => onSaveToCustomList(list.id)}
                    rippleColor={colors.ripple}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 9,
                      paddingHorizontal: 10,
                      backgroundColor: colors.row || '#1a1b1d',
                      borderLeftWidth: 3,
                      borderLeftColor: colors.secondary || '#4dabf7',
                      borderRadius: 0,
                      marginBottom: 2,
                    }}>
                    <>
                      <Icon
                        name="bookmark"
                        size={16}
                        color={colors.secondary || '#4dabf7'}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{ color: colors.text, fontSize: fontSizes.p, fontWeight: 'bold' }}>
                          {list.name}
                        </Text>
                      </View>
                      <Text style={{ color: colors.faded || '#888', fontSize: fontSizes.small, marginRight: 8 }}>
                        {count} {count === 1 ? 'příspěvek' : count >= 2 && count <= 4 ? 'příspěvky' : 'příspěvků'}
                      </Text>
                      <Icon name="plus" size={16} color={colors.secondary || '#4dabf7'} />
                    </>
                  </TouchableRipple>
                )
              })}
            </ScrollView>
          ) : (
            <View
              style={{
                padding: 14,
                backgroundColor: colors.card || '#2a2b2e',
                borderRadius: 0,
                borderWidth: 0.5,
                borderColor: colors.border || '#333',
                marginBottom: 2,
                alignItems: 'center',
              }}>
              <Icon name="info" size={24} color={colors.secondary || '#4dabf7'} style={{ marginBottom: 6 }} />
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSizes.p,
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 4,
                }}>
                {t('reminders.noCustomLists') || 'Nemáte žádné vlastní seznamy'}
              </Text>
              <Text
                style={{
                  color: colors.faded || '#888',
                  fontSize: fontSizes.small,
                  textAlign: 'center',
                }}>
                {t('reminders.noCustomListsHint') ||
                  'Můžete je vytvořit v záložce Připomínky > Vlastní.'}
              </Text>
            </View>
          )}
        </Dialog.Content>

        <Dialog.Actions style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
          <Button onPress={onDismiss} color={colors.disabled || '#888'}>
            {t('cancel') || 'Zrušit'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
