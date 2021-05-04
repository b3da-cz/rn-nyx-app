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
  BookmarksView,
  HistoryView,
  ImageModal,
  MailView,
  DiscussionView,
  ComposePostView,
  NotificationsView,
  LastPostsView,
  ProfileView,
  SearchView,
} from './view'

export const Router = ({ config, nyx, refs, onConfigReload }) => {
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

  const setRef = (component, ref) => {
    refs[component] = ref
  }

  const showImages = (navigation, images, imgIndex) => {
    navigation.navigate('gallery', { images, imgIndex })
  }

  const checkNotifications = () => {
    if (nyx?.store?.context?.user?.notifications_unread !== notificationsUnread) {
      setNotificationsUnread(nyx.store.context.user.notifications_unread)
    }
  }

  const RootStack = createStackNavigator()
  const NotificationsStack = createStackNavigator()
  const BookmarksStack = createStackNavigator()
  const HistoryStack = createStackNavigator()
  const SearchStack = createStackNavigator()
  const LastPostsStack = createStackNavigator()
  const MailStack = createStackNavigator()
  const Tab = createMaterialTopTabNavigator()
  const discussionOptions = { headerShown: true, title: '' }

  const Discussion = ({ navigation, route }) => {
    const { discussionId, postId, showHeader, jumpToLastSeen } = route.params
    return (
      <DiscussionView
        ref={r => setRef('DiscussionView', r)}
        navigation={navigation}
        id={discussionId}
        postId={postId}
        showHeader={showHeader}
        jumpToLastSeen={jumpToLastSeen}
        onDiscussionFetched={({ title, uploadedFiles }) => navigation.setOptions({ title })} //todo show uploaded files len if any
        onImages={(images, i) => showImages(navigation, images, i)}
        // onHeaderSwipe={isSwiping => navigation.setOptions({ gestureEnabled: !isSwiping })}
        // onHeaderSwipe={isSwiping => setNavGesturesEnabled(isSwiping)}
      />
    )
  }

  const Mail = ({ navigation }) => (
    <MailView
      ref={r => setRef('MailView', r)}
      navigation={navigation}
      onImages={(images, i) => showImages(navigation, images, i)}
      onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
    />
  )

  const Bookmarks = ({ navigation }) => (
    <BookmarksView
      navigation={navigation}
      onDetailShow={discussionId => navigation.push('discussion', { discussionId, jumpToLastSeen: true })}
    />
  )

  const History = ({ navigation }) => (
    <HistoryView
      navigation={navigation}
      onDetailShow={discussionId => navigation.push('discussion', { discussionId, jumpToLastSeen: true })}
    />
  )

  const Notifications = ({ navigation }) => (
    <NotificationsView
      onImages={(images, i) => showImages(navigation, images, i)}
      onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
    />
  )

  const LastPosts = ({ navigation }) => (
    <LastPostsView
      onImages={(images, i) => showImages(navigation, images, i)}
      onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
    />
  )

  const Search = ({ navigation }) => (
    <SearchView
      onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
      onUserSelected={username => navigation.push('composePost', { isMailPost: true, username })}
    />
  )

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

  const NotificationsStackContainer = ({ navigation, route }) => (
    <NotificationsStack.Navigator initialRouteName={'notifications'} screenOptions={NavOptions.screenOptions}>
      <NotificationsStack.Screen name={'notifications'} component={Notifications} options={{ headerShown: false }} />
      <NotificationsStack.Screen name={'discussion'} component={Discussion} options={discussionOptions} />
    </NotificationsStack.Navigator>
  )

  const BookmarksStackContainer = ({ navigation, route }) => (
    <BookmarksStack.Navigator initialRouteName={'bookmarks'} screenOptions={NavOptions.screenOptions}>
      <BookmarksStack.Screen name={'bookmarks'} component={Bookmarks} options={{ headerShown: false }} />
      <BookmarksStack.Screen name={'discussion'} component={Discussion} options={discussionOptions} />
    </BookmarksStack.Navigator>
  )

  const HistoryStackContainer = ({ navigation, route }) => (
    <HistoryStack.Navigator initialRouteName={'history'} screenOptions={NavOptions.screenOptions}>
      <HistoryStack.Screen name={'history'} component={History} options={{ headerShown: false }} />
      <HistoryStack.Screen name={'discussion'} component={Discussion} options={discussionOptions} />
    </HistoryStack.Navigator>
  )

  const MailStackContainer = ({ navigation, route }) => (
    <MailStack.Navigator initialRouteName={'mail'} screenOptions={NavOptions.screenOptions}>
      <MailStack.Screen name={'mail'} component={Mail} options={{ headerShown: false }} />
      <MailStack.Screen name={'discussion'} component={Discussion} options={discussionOptions} />
    </MailStack.Navigator>
  )

  const LastPostsStackContainer = ({ navigation, route }) => (
    <LastPostsStack.Navigator initialRouteName={'last'} screenOptions={NavOptions.screenOptions}>
      <LastPostsStack.Screen name={'last'} component={LastPosts} options={{ headerShown: false }} />
      <LastPostsStack.Screen name={'discussion'} component={Discussion} options={discussionOptions} />
    </LastPostsStack.Navigator>
  )

  const SearchStackContainer = ({ navigation, route }) => (
    <SearchStack.Navigator initialRouteName={'search'} screenOptions={NavOptions.screenOptions}>
      <SearchStack.Screen name={'search'} component={Search} options={{ headerShown: false }} />
      <SearchStack.Screen name={'discussion'} component={Discussion} options={discussionOptions} />
    </SearchStack.Navigator>
  )

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
        options={{ cardStyle: { backgroundColor: '#000' } }}
        tabBarOptions={NavOptions.tabBarOptions}>
        {config.isHistoryEnabled && (
          <Tab.Screen
            name={'historyStack'}
            component={HistoryStackContainer}
            options={{ tabBarLabel: () => <Icon name="book-open" size={14} color="#ccc" /> }}
          />
        )}
        {config.isBookmarksEnabled && (
          <Tab.Screen
            name={'bookmarksStack'}
            component={BookmarksStackContainer}
            options={{ tabBarLabel: () => <Icon name="bookmark" size={14} color="#ccc" /> }}
          />
        )}
        {config.isSearchEnabled && (
          <Tab.Screen
            name={'searchStack'}
            component={SearchStackContainer}
            options={{ tabBarLabel: () => <Icon name="search" size={14} color="#ccc" /> }}
          />
        )}
        <Tab.Screen
          name={'mailStack'}
          component={MailStackContainer}
          options={{ tabBarLabel: () => <Icon name="mail" size={14} color="#ccc" /> }}
        />
        {config.isLastEnabled && (
          <Tab.Screen
            name={'lastPostsStack'}
            component={LastPostsStackContainer}
            options={{ tabBarLabel: () => <Icon name="inbox" size={14} color="#ccc" /> }}
          />
        )}
        <Tab.Screen
          name={'notificationsStack'}
          component={NotificationsStackContainer}
          options={{ tabBarLabel: () => <Icon name="activity" size={14} color="#ccc" /> }}
        />
        <Tab.Screen
          name={'profile'}
          component={Profile}
          options={{ tabBarLabel: () => <Icon name="settings" size={14} color="#ccc" /> }}
        />
      </Tab.Navigator>
    )
  }
  return (
    <RootStack.Navigator initialRouteName={'tabs'} mode={'modal'} options={{ cardStyle: { backgroundColor: '#000' } }}>
      <RootStack.Screen name={'gallery'} component={Gallery} options={{ headerShown: false }} />
      <RootStack.Screen name={'composePost'} component={ComposePost} options={{ title: '' }} />
      <RootStack.Screen name={'tabs'} component={TabContainer} options={{ headerShown: false }} />
    </RootStack.Navigator>
  )
}
