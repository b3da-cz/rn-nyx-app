/**
 * @format
 * @flow
 */
import React, { useEffect } from 'react'
import 'react-native-gesture-handler'
import { NetworkConsumer } from 'react-native-offline'
import { createNativeStackNavigator } from 'react-native-screens/native-stack'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { RNNotificationBanner } from 'react-native-notification-banner'
import Icon from 'react-native-vector-icons/Feather'
import { NotificationIconComponent } from './component'
import { NavOptions, showNotificationBanner, subscribeFCM, t, wait } from './lib'
import {
  BookmarksStackContainer,
  HistoryStackContainer,
  LastPostsStackContainer,
  MailStackContainer,
  NotificationsStackContainer,
  RemindersStackContainer,
  SearchStackContainer,
} from './routes'
import { ImageModal, ProfileView, SettingsView } from './view'

export const Router = ({ config, nyx, refs, theme, onConfigReload, onFiltersReload }) => {
  let nav = null // meh, there have to be cleaner way to do this outside of root stack, .. except there is not :( ref not working on latest RN-N
  useEffect(() => {
    const sub = subscribeFCM(message => {
      nyx.getContext()
      switch (message.type) {
        case 'new_mail':
          if (!message.isForegroundMsg && nav && typeof nav.navigate === 'function') {
            setTimeout(() => nav.navigate('mailStack', { screen: 'mail' }), 300)
          }
          if (message.isForegroundMsg) {
            showNotificationBanner({
              title: message.title,
              body: message.body?.length > 90 ? `${message.body.substr(0, 90)} ...` : message.body,
              tintColor: theme.colors.secondary,
              icon: 'mail',
              onClick: async () => {
                nav?.navigate('mailStack', { screen: 'mail' })
                await wait()
                refs?.MailView?.getLatestMessages()
                RNNotificationBanner.Dismiss()
              },
            })
          }
          break
        case 'reply':
          if (!message.isForegroundMsg && nav && typeof nav.navigate === 'function') {
            setTimeout(() => nav.navigate('notificationsStack', { screen: 'notifications' }), 300)
          }
          if (message.isForegroundMsg) {
            showNotificationBanner({
              title: message.title,
              body: message.body?.length > 90 ? `${message.body.substr(0, 90)} ...` : message.body,
              tintColor: theme.colors.primary,
              icon: 'corner-down-right',
              onClick: async () => {
                nav.navigate('notificationsStack', { screen: 'notifications' })
                if (message.discussionId > 0) {
                  await wait()
                  nav.push('discussion', { discussionId: message.discussionId, postId: message.postId })
                }
                RNNotificationBanner.Dismiss()
              },
            })
          }
          break
      }
    })
    return () => {
      if (sub.backgroundNotificationListener) {
        sub.backgroundNotificationListener()
      }
      if (sub.onMessageListener) {
        sub.onMessageListener()
      }
    }
  })

  const getTabIconColor = isFocused => (isFocused ? theme.colors.text : theme.colors.disabled)

  const RootStack = createNativeStackNavigator()
  const Tab = createMaterialTopTabNavigator()

  const Profile = ({ navigation }) => <ProfileView navigation={navigation} />
  const Settings = ({ navigation }) => (
    <SettingsView config={config} onConfigChange={() => onConfigReload()} onFiltersChange={() => onFiltersReload()} />
  )

  const Gallery = ({ navigation, route }) => {
    const { images, imgIndex } = route.params
    return <ImageModal images={images} imgIndex={imgIndex} isShowing={true} onExit={() => navigation.goBack()} />
  }

  const TabContainer = ({ navigation }) => {
    nav = navigation
    return (
      <Tab.Navigator
        initialRouteName={config.initialRouteName}
        tabBarPosition={config.isBottomTabs ? 'bottom' : 'top'}
        lazy={true}
        swipeEnabled={config.isNavGesturesEnabled}
        // gestureHandlerProps={{
        //   wip, needs more testing
        //   maxPointers: 1,
        //   minDist: 200,
        //   minDeltaX: 80,
        //   activeOffsetX: undefined,
        //
        //   hitSlop: {height: 60, bottom: 0},
        //   minDeltaY: 0,
        // }}
        options={{ cardStyle: NavOptions.cardStyle(theme) }}
        tabBarOptions={NavOptions.tabBarOptions(theme)}>
        {config.isHistoryEnabled && (
          <Tab.Screen
            name={'historyStack'}
            component={HistoryStackContainer}
            options={{
              tabBarLabel: ({ focused }) => <Icon name="book-open" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        {config.isBookmarksEnabled && (
          <Tab.Screen
            name={'bookmarksStack'}
            component={BookmarksStackContainer}
            options={{
              tabBarLabel: ({ focused }) => <Icon name="bookmark" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        {config.isSearchEnabled && (
          <Tab.Screen
            name={'searchStack'}
            component={SearchStackContainer}
            options={{
              tabBarLabel: ({ focused }) => <Icon name="search" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        {config.isLastEnabled && (
          <Tab.Screen
            name={'lastPostsStack'}
            component={LastPostsStackContainer}
            options={{
              tabBarLabel: ({ focused }) => <Icon name="inbox" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        {config.isRemindersEnabled && (
          <Tab.Screen
            name={'remindersStack'}
            component={RemindersStackContainer}
            options={{
              tabBarLabel: ({ focused }) => <Icon name="bell" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        <Tab.Screen
          name={'notificationsStack'}
          component={NotificationsStackContainer}
          options={{
            tabBarLabel: ({ focused }) => <NotificationIconComponent color={getTabIconColor(focused)} />,
          }}
        />
        <Tab.Screen
          name={'mailStack'}
          component={MailStackContainer}
          options={{
            tabBarLabel: ({ focused }) => <NotificationIconComponent color={getTabIconColor(focused)} isMail={true} />,
          }}
        />
        <Tab.Screen
          name={'profile'}
          component={Profile}
          options={{
            tabBarLabel: ({ focused }) => <Icon name={'user'} size={14} color={getTabIconColor(focused)} />,
          }}
        />
      </Tab.Navigator>
    )
  }
  return (
    <RootStack.Navigator initialRouteName={'tabs'} mode={'modal'} options={{ cardStyle: NavOptions.cardStyle(theme) }}>
      <RootStack.Screen name={'gallery'} component={Gallery} options={{ headerShown: false }} />
      <RootStack.Screen
        name={'settings'}
        component={Settings}
        options={{ title: t('profile.settings'), headerTopInsetEnabled: false }}
      />
      <RootStack.Screen name={'tabs'} component={TabContainer} options={{ headerShown: false }} />
    </RootStack.Navigator>
  )
}
