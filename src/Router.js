/**
 * @format
 * @flow
 */
import React, { useEffect, useState } from 'react'
import 'react-native-gesture-handler'
import { createStackNavigator } from '@react-navigation/stack'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { RNNotificationBanner } from 'react-native-notification-banner'
import Icon from 'react-native-vector-icons/Feather'
import { Styling, NavOptions, subscribeFCM, t } from './lib'
import {
  BookmarksStackContainer,
  HistoryStackContainer,
  LastPostsStackContainer,
  MailStackContainer,
  NotificationsStackContainer,
  RemindersStackContainer,
  SearchStackContainer,
} from './routes'
import { ImageModal, ComposePostView, ProfileView } from './view'

export const Router = ({ config, nyx, refs, isDarkMode, onConfigReload }) => {
  let nav = null // meh, there have to be cleaner way to do this outside of root stack, .. except there is not :( ref not working on latest RN-N
  const [notificationsUnread, setNotificationsUnread] = useState(0) // todo badge
  useEffect(() => {
    const sub = subscribeFCM(message => {
      switch (message.type) {
        case 'new_mail':
          if (!message.isForegroundMsg && nav && typeof nav.navigate === 'function') {
            setTimeout(() => nav.navigate('mailStack', { screen: 'mail' }), 300) // todo setting
          }
          if (message.isForegroundMsg) {
            RNNotificationBanner.Show({
              title: message.title,
              subTitle: message.body?.length > 90 ? `${message.body.substr(0, 90)} ...` : message.body,
              titleColor: Styling.colors.white,
              subTitleColor: Styling.colors.white,
              tintColor: Styling.colors.secondary,
              duration: 5000,
              enableProgress: false,
              withIcon: true,
              dismissable: true,
              icon: <Icon name="mail" size={20} color={Styling.colors.white} family={'Feather'} />,
              onClick: () => {
                nav?.navigate('mailStack', { screen: 'mail' })
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
            RNNotificationBanner.Show({
              title: message.title,
              subTitle: message.body?.length > 90 ? `${message.body.substr(0, 90)} ...` : message.body,
              titleColor: Styling.colors.white,
              subTitleColor: Styling.colors.white,
              tintColor: Styling.colors.primary,
              duration: 5000,
              enableProgress: false,
              withIcon: true,
              dismissable: true,
              icon: <Icon name="corner-down-right" size={20} color={Styling.colors.white} family={'Feather'} />,
              onClick: () => {
                if (message.discussionId > 0) {
                  nav.navigate('notificationsStack', {
                    screen: 'discussion',
                    params: { discussionId: message.discussionId, postId: message.postId },
                  })
                } else {
                  nav.navigate('notificationsStack', { screen: 'notifications' })
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

  const checkNotifications = () => {
    if (nyx?.store?.context?.user?.notifications_unread !== notificationsUnread) {
      setNotificationsUnread(nyx.store.context.user.notifications_unread)
    }
  }

  const getTabIconColor = isFocused =>
    isFocused && isDarkMode
      ? Styling.colors.lighter
      : isFocused && !isDarkMode
      ? Styling.colors.black
      : isDarkMode
      ? Styling.colors.mediumlight
      : Styling.colors.medium

  const RootStack = createStackNavigator()
  const Tab = createMaterialTopTabNavigator()

  const Profile = ({ navigation }) => <ProfileView config={config} onConfigChange={() => onConfigReload()} />

  const Gallery = ({ navigation, route }) => {
    const { images, imgIndex } = route.params
    return <ImageModal images={images} imgIndex={imgIndex} isShowing={true} onExit={() => navigation.goBack()} />
  }

  const ComposePost = ({ navigation, route }) => {
    const isMailPost = route?.params?.isMailPost
    const discussionId = isMailPost ? null : route.params.discussionId
    const postId = isMailPost ? null : route.params.postId
    const discussion = isMailPost
      ? null
      : nyx.store.discussions.filter(d => Number(d.discussion_id) === Number(discussionId))[0]
    const title = isMailPost ? route.params.username : discussion?.full_name || ''
    const uploadedFiles = isMailPost ? [] : discussion?.detail?.discussion_common?.waiting_files
    return (
      <ComposePostView
        isMailPost={isMailPost}
        uploadedFiles={uploadedFiles}
        username={route?.params?.username}
        discussionId={discussionId}
        postId={postId}
        replyTo={route?.params?.replyTo}
        onSend={() => {
          navigation.goBack()
          setTimeout(() => {
            refs?.DiscussionView?.reloadDiscussionLatest(true)
            refs?.MailView?.getLatestMessages()
          }, 300)
        }}
        onMount={() => navigation.setOptions({ title: isMailPost ? t('new.message') : `${t('new.post')}: ${title}` })}
      />
    )
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
        options={{ cardStyle: NavOptions.cardStyle(isDarkMode) }}
        tabBarOptions={NavOptions.tabBarOptions(isDarkMode)}>
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
        <Tab.Screen
          name={'mailStack'}
          component={MailStackContainer}
          options={{
            tabBarLabel: ({ focused }) => <Icon name="mail" size={14} color={getTabIconColor(focused)} />,
          }}
        />
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
            tabBarLabel: ({ focused }) => <Icon name="activity" size={14} color={getTabIconColor(focused)} />,
          }}
        />
        <Tab.Screen
          name={'profile'}
          component={Profile}
          options={{
            tabBarLabel: ({ focused }) => <Icon name="settings" size={14} color={getTabIconColor(focused)} />,
          }}
        />
      </Tab.Navigator>
    )
  }
  return (
    <RootStack.Navigator
      initialRouteName={'tabs'}
      mode={'modal'}
      options={{ cardStyle: NavOptions.cardStyle(isDarkMode) }}>
      <RootStack.Screen name={'gallery'} component={Gallery} options={{ headerShown: false }} />
      <RootStack.Screen name={'composePost'} component={ComposePost} options={{ title: '' }} />
      <RootStack.Screen name={'tabs'} component={TabContainer} options={{ headerShown: false }} />
    </RootStack.Navigator>
  )
}
