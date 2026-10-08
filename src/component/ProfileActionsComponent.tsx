import React, { useState } from 'react'
import { Dimensions, View } from 'react-native'
import { IconButton, Menu } from 'react-native-paper'
import { t, Theme } from '../lib'

type Props = {
  navigation: any
  theme: Theme
  isLlmEnabled?: boolean
  availableWidth?: number
}

type ActionItem = {
  route: string
  icon: string
  title: string
}

export const ProfileActionsComponent: React.FC<Props> = ({
  navigation,
  theme,
  isLlmEnabled = false,
  availableWidth,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const actions: ActionItem[] = []

  if (isLlmEnabled) {
    actions.push({
      route: 'llmLibrary',
      icon: 'chip',
      title: t('llm.tabLibrary') || 'Knihovna modelů',
    })
  }
  actions.push({
    route: 'about',
    icon: 'github',
    title: t('profile.about') || 'O aplikaci',
  })
  actions.push({
    route: 'support',
    icon: 'heart-outline',
    title: t('profile.support') || 'Podpora vývoje',
  })
  actions.push({
    route: 'theme',
    icon: 'palette-advanced',
    title: t('profile.theme') || 'Vzhled',
  })
  actions.push({
    route: 'settings',
    icon: 'cog-outline',
    title: t('profile.settings') || 'Nastavení',
  })

  const ITEM_WIDTH = 46
  const requiredWidth = actions.length * ITEM_WIDTH
  const effectiveAvailable =
    availableWidth !== undefined && availableWidth > 0
      ? availableWidth
      : Dimensions.get('window').width - 160
  const isCollapsed = effectiveAvailable < requiredWidth

  if (isCollapsed) {
    return (
      <View style={{ marginLeft: 'auto', marginTop: -20 }}>
        <Menu
          visible={isMenuOpen}
          onDismiss={() => setIsMenuOpen(false)}
          anchor={
            <IconButton
              icon={'dots-vertical'}
              size={24}
              color={theme.colors.text}
              onPress={() => setIsMenuOpen(true)}
              rippleColor={theme.colors.ripple}
            />
          }>
          {actions.map(action => (
            <Menu.Item
              key={action.route}
              icon={action.icon}
              title={action.title}
              onPress={() => {
                setIsMenuOpen(false)
                navigation.push(action.route)
              }}
            />
          ))}
        </Menu>
      </View>
    )
  }

  return (
    <View style={{ marginLeft: 'auto', flexDirection: 'row', marginTop: -20 }}>
      {actions.map((action, idx) => (
        <IconButton
          key={action.route}
          icon={action.icon}
          size={24}
          color={theme.colors.text}
          style={{ marginRight: idx === actions.length - 1 ? 0 : 8 }}
          onPress={() => navigation.push(action.route)}
          rippleColor={theme.colors.ripple}
        />
      ))}
    </View>
  )
}
