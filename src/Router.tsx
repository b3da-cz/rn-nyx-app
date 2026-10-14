/**
 * @format
 * @flow
 */
import React, { useEffect, useRef } from 'react'
// import { NetworkConsumer } from 'react-native-offline'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createMaterialTopTabNavigator, MaterialTopTabBar } from '@react-navigation/material-top-tabs'
import { RNNotificationBanner } from 'react-native-notification-banner'
import Icon from 'react-native-vector-icons/Feather'
import { ExpandableTabBar, NotificationIconComponent, StackHeaderComponent } from './component'
import {
  discussionScreenOptions,
  LlmQueue,
  NavOptions,
  Nyx,
  rgbToHex,
  showNotificationBanner,
  subscribeFCM,
  t,
  Theme,
  wait,
} from './lib'
import {
  BookmarksStackContainer,
  Discussion,
  EventsStackContainer,
  HistoryStackContainer,
  LastPostsStackContainer,
  LlmAssistant,
  LlmLibrary,
  MailStackContainer,
  NotificationsStackContainer,
  RemindersStackContainer,
  SearchStackContainer,
} from './routes'
import { AboutView, FileView, ImageModal, ProfileView, SettingsView, SupportView, ThemeView } from './view'

type Props = {
  config: any
  nyx: Nyx
  refs: any
  theme: Theme
  onConfigReload: Function
  onFiltersReload: Function
}

const FileScreen = ({ route }) => (
  <FileView path={route?.params?.path || ''} name={route?.params?.name || ''} external={!!route?.params?.external} />
)

const Gallery = ({ navigation, route }) => {
  const { images, imgIndex, onClose, onRated, onViewImage } = route.params || {}
  const currentIndexRef = useRef(imgIndex || 0)
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      const img = images?.[currentIndexRef.current]
      if (img?.postId != null) {
        onClose?.(img.postId)
      }
    })
    return unsub
  }, [navigation, images, onClose])
  return (
    <ImageModal
      images={images}
      imgIndex={imgIndex}
      isShowing={true}
      onIndexChange={i => {
        currentIndexRef.current = i
        onViewImage?.(images?.[i])
      }}
      onRated={onRated}
      onExit={() => navigation.goBack()}
    />
  )
}

export const Router = ({ config, nyx, refs, theme, onConfigReload, onFiltersReload }: Props) => {
  let nav: any = null // meh, there have to be cleaner way to do this outside of root stack, .. except there is not :( ref not working on latest RN-N
  useEffect(() => {
    const sub = subscribeFCM(message => {
      nyx.api.getContext()
      switch (message.type) {
        case 'new_mail':
          const navigateToMail = async () => {
            const mailRoute = refs?.tabState?.routes?.find((r: any) => r.name === 'mailStack')
            const targetKey = mailRoute?.key || 'mailStack'
            if (refs?.jumpTo) {
              refs.jumpTo(targetKey)
            }
            if (refs?.tabNav?.navigate) {
              refs.tabNav.navigate('mailStack', { screen: 'mail' })
            } else if (refs?.nav?.navigate) {
              refs.nav.navigate('mailStack', { screen: 'mail' })
            } else if (nav?.navigate) {
              nav.navigate('mailStack', { screen: 'mail' })
            }
            await wait(200)
            refs?.MailView?.getLatestMessages()
          }
          if (!message.isForegroundMsg) {
            setTimeout(navigateToMail, 300)
          }
          if (message.isForegroundMsg) {
            showNotificationBanner({
              title: message.title,
              body: message.body?.length > 90 ? `${message.body.substr(0, 90)} ...` : message.body,
              tintColor: rgbToHex(theme.colors.secondary),
              icon: 'mail',
              onClick: async () => {
                await navigateToMail()
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
              tintColor: rgbToHex(theme.colors.primary),
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
    const unsubLlm = LlmQueue.onTaskCompleted(task => {
      showNotificationBanner({
        title: 'LLM Asistent odpověděl',
        body: `${task.discussionTitle || 'Diskuze'}: odpověď je připravena v Knihovně`,
        tintColor: rgbToHex(theme.colors.primary),
        icon: 'check-circle',
        onClick: async () => {
          if (nav && typeof nav.navigate === 'function') {
            nav.navigate('tabs', { screen: 'profile' })
            await wait(100)
            if (typeof nav.push === 'function') {
              nav.push('llmLibrary')
            } else {
              nav.navigate('llmLibrary')
            }
          }
          RNNotificationBanner.Dismiss()
        },
      })
    })
    return () => {
      if (sub && sub.backgroundNotificationListener) {
        sub.backgroundNotificationListener()
      }
      if (sub && sub.onMessageListener) {
        sub.onMessageListener()
      }
      if (unsubLlm) {
        unsubLlm()
      }
    }
  })

  const getTabIconColor = isFocused => (isFocused ? theme.colors.text : theme.colors.disabled)

  const RootStack = createNativeStackNavigator()
  const Tab = createMaterialTopTabNavigator()

  const renderTabBar = props => {
    if (refs) {
      refs.tabNav = props.navigation
      refs.jumpTo = props.jumpTo
      refs.tabState = props.state
    }
    return config.isNavbarExpandEnabled ? (
      <ExpandableTabBar {...props} config={config} theme={theme} />
    ) : (
      <MaterialTopTabBar {...props} />
    )
  }

  const Profile = ({ navigation }) => <ProfileView navigation={navigation} />
  const About = ({ navigation }) => <AboutView navigation={navigation} />
  const Support = ({ navigation }) => <SupportView navigation={navigation} />
  const Settings = ({ navigation }) => (
    <SettingsView
      navigation={navigation}
      config={config}
      onConfigChange={() => onConfigReload()}
      onFiltersChange={() => onFiltersReload()}
    />
  )
  const ThemeScreen = () => <ThemeView config={config} onConfigChange={() => onConfigReload()} />

  const TabContainer = ({ navigation }) => {
    nav = navigation
    if (refs) {
      refs.nav = navigation
    }
    return (
      <Tab.Navigator
        initialRouteName={config.initialRouteName}
        tabBarPosition={config.isBottomTabs ? 'bottom' : 'top'}
        backBehavior="history"
        tabBar={renderTabBar}
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
        // options={{ cardStyle: NavOptions.cardStyle(theme) }}
        overScrollMode="never"
        screenOptions={{
          lazy: true,
          swipeEnabled: config.isNavGesturesEnabled,
          ...NavOptions.tabBarOptions(theme),
        }}>
        {config.isHistoryEnabled && (
          <Tab.Screen
            name={'historyStack'}
            component={HistoryStackContainer}
            options={{
              title: t('history'),
              tabBarLabel: ({ focused }) => <Icon name="book-open" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        {config.isBookmarksEnabled && (
          <Tab.Screen
            name={'bookmarksStack'}
            component={BookmarksStackContainer}
            options={{
              title: t('bookmarks'),
              tabBarLabel: ({ focused }) => <Icon name="bookmark" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        {config.isSearchEnabled && (
          <Tab.Screen
            name={'searchStack'}
            component={SearchStackContainer}
            options={{
              title: t('search.title'),
              tabBarLabel: ({ focused }) => <Icon name="search" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        {config.isLastEnabled && (
          <Tab.Screen
            name={'lastPostsStack'}
            component={LastPostsStackContainer}
            options={{
              title: t('last'),
              tabBarLabel: ({ focused }) => <Icon name="inbox" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        {config.isRemindersEnabled && (
          <Tab.Screen
            name={'remindersStack'}
            component={RemindersStackContainer}
            options={{
              title: t('reminders.title'),
              tabBarLabel: ({ focused }) => <Icon name="bell" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        {config.isEventsEnabled && (
          <Tab.Screen
            name={'eventsStack'}
            component={EventsStackContainer}
            options={{
              title: t('events.title'),
              tabBarLabel: ({ focused }) => <Icon name="calendar" size={14} color={getTabIconColor(focused)} />,
            }}
          />
        )}
        <Tab.Screen
          name={'notificationsStack'}
          component={NotificationsStackContainer}
          options={{
            title: t('notifications'),
            tabBarLabel: ({ focused }) => <NotificationIconComponent color={getTabIconColor(focused)} />,
          }}
        />
        <Tab.Screen
          name={'mailStack'}
          component={MailStackContainer}
          options={{
            title: t('mail'),
            tabBarLabel: ({ focused }) => <NotificationIconComponent color={getTabIconColor(focused)} isMail={true} />,
          }}
        />
        <Tab.Screen
          name={'profile'}
          component={Profile}
          options={{
            title: t('profile.tab'),
            tabBarLabel: ({ focused }) => <Icon name={'user'} size={14} color={getTabIconColor(focused)} />,
          }}
        />
      </Tab.Navigator>
    )
  }
  return (
    <RootStack.Navigator
      initialRouteName={'tabs'}
      screenOptions={{
        ...NavOptions.screenOptions(theme),
        header: props => <StackHeaderComponent {...props} theme={theme} />,
      }}>
      <RootStack.Screen name={'gallery'} component={Gallery} options={{ headerShown: false }} />
      <RootStack.Screen
        name={'file'}
        component={FileScreen}
        options={({ route }) => ({ title: (route.params as { name?: string } | undefined)?.name || '' })}
      />
      <RootStack.Screen
        name={'settings'}
        component={Settings}
        options={{ title: t('profile.settings') }}
      />
      <RootStack.Screen
        name={'theme'}
        component={ThemeScreen}
        options={{ title: t('profile.theme') }}
      />
      <RootStack.Screen
        name={'about'}
        component={About}
        options={{ title: t('profile.about') }}
      />
      <RootStack.Screen
        name={'support'}
        component={Support}
        options={{ title: t('profile.support') || 'Podpora vývoje' }}
      />
      <RootStack.Screen
        name={'llmLibrary'}
        component={LlmLibrary}
        options={{ title: t('llm.tabLibrary') || 'Knihovna' }}
      />
      <RootStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
      <RootStack.Screen name={'llm'} component={LlmAssistant} options={discussionScreenOptions} />
      <RootStack.Screen name={'tabs'} component={TabContainer} options={{ headerShown: false }} />
    </RootStack.Navigator>
  )
}
