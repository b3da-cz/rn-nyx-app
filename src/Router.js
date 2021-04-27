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
import { Styling, NavOptions, subscribeFCM, Storage } from './lib';
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

export const Router = ({ nyx, refs }) => {
  let nav = null // meh, there have to be cleaner way to do this outside of root stack, .. except there is not :( ref not working on latest RN-N
  const [notificationsUnread, setNotificationsUnread] = useState(0) // todo badge
  const [isBookmarksVisible, setIsBookmarksVisible] = useState(true)
  const [isHistoryVisible, setIsHistoryVisible] = useState(true)
  useEffect(() => {
    const getConfig = async () => {
      const conf = await Storage.getConfig()
      if (isBookmarksVisible !== conf.isBookmarksEnabled) {
        setIsBookmarksVisible(conf.isBookmarksEnabled)
      }
      if (isHistoryVisible !== conf.isHistoryEnabled) {
        setIsHistoryVisible(conf.isHistoryEnabled)
      }
    }
    setTimeout(() => getConfig())

    const sub = subscribeFCM(message => {
      switch (message.type) {
        case 'new_mail':
          RNNotificationBanner.Show({
            title: message.title,
            subTitle: message.body,
            titleColor: Styling.colors.white,
            subTitleColor: Styling.colors.white,
            tintColor: Styling.colors.secondary,
            duration: 5000,
            enableProgress: false,
            withIcon: true,
            dismissable: true,
            icon: <Icon name="mail" size={20} color="#FFFFFF" family={'Feather'} />,
            onClick: () => {
              refs?.MailView?.getLatestMessages()
              RNNotificationBanner.Dismiss()
            },
          })

          // if (message.isForegroundMsg && refs?.MailView) {
          //   refs.MailView.getLatestMessages()
          // } else {
          //   // setTimeout(() => this.switchView('mail'), 100)
          // }
          break
        case 'reply':
          if (!message.isForegroundMsg && nav && typeof nav.navigate === 'function') {
            nav.navigate('notifications')
          }
          if (message.isForegroundMsg && refs?.DiscussionView) {
            RNNotificationBanner.Show({
              title: message.title,
              subTitle: message.body,
              titleColor: Styling.colors.white,
              subTitleColor: Styling.colors.white,
              tintColor: Styling.colors.primary,
              duration: 5000,
              enableProgress: false,
              withIcon: true,
              dismissable: true,
              icon: <Icon name="mail" size={20} color="#FFFFFF" family={'Feather'} />,
              onClick: () => {
                nav.navigate('notifications')
                RNNotificationBanner.Dismiss()
              },
            })
            // refs.DiscussionView.reloadDiscussionLatest()
            // refs.DiscussionView.jumpToPost(message.discussionId, message.postId)
          } else {
            // setTimeout(() => this.switchView('mail'), 100)
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
  const discussionOptions = { headerShown: true }

  const Discussion = ({ navigation, route }) => {
    const { discussionId, postId } = route.params
    return (
      <DiscussionView
        ref={r => setRef('DiscussionView', r)}
        navigation={navigation}
        id={discussionId}
        postId={postId}
        onDiscussionFetched={({ title, uploadedFiles }) => navigation.setOptions({ title })}
        onImages={(images, i) => showImages(navigation, images, i)}
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
      onDetailShow={discussionId => navigation.push('discussion', { discussionId })}
    />
  )

  const History = ({ navigation }) => (
    <HistoryView
      navigation={navigation}
      onDetailShow={discussionId => navigation.push('discussion', { discussionId })}
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

  const Profile = ({ navigation }) => (
    <ProfileView
      onSettingsChange={({ isBookmarksEnabled, isHistoryEnabled }) => {
        if (isBookmarksEnabled !== isBookmarksVisible) {
          setIsBookmarksVisible(isBookmarksEnabled)
        }
        if (isHistoryEnabled !== isHistoryVisible) {
          setIsHistoryVisible(isHistoryEnabled)
        }
      }}
    />
  )

  const Gallery = ({ navigation, route }) => {
    const { images, imgIndex } = route.params
    return <ImageModal images={images} imgIndex={imgIndex} isShowing={true} onExit={() => navigation.goBack()} />
  }

  const ComposePost = ({ navigation, route }) => {
    const isMailPost = route?.params?.isMailPost
    const discussionId = isMailPost ? null : route.params.discussionId
    const postId = isMailPost ? null : route.params.postId
    let title = isMailPost ? route.params.username : ''
    const discussion = isMailPost
      ? null
      : nyx.store.discussions.filter(d => Number(d.discussion_id) === Number(discussionId))[0]
    if (discussion) {
      title = discussion?.full_name
    }
    const uploadedFiles = isMailPost ? [] : discussion?.detail?.discussion_common?.waiting_files
    return (
      <ComposePostView
        title={title}
        isMailPost={isMailPost}
        uploadedFiles={uploadedFiles}
        username={route?.params?.username}
        discussionId={discussionId}
        postId={postId}
        replyTo={route?.params?.replyTo}
        onSend={() => {
          navigation.goBack()
          refs?.DiscussionView?.reloadDiscussionLatest()
          refs?.MailView?.getLatestMessages()
        }}
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
        // initialRouteName={'historyStack'}
        tabBarPosition={'bottom'}
        lazy={true}
        tabBarOptions={NavOptions.tabBarOptions}>
        {isHistoryVisible && (
          <Tab.Screen
            name={'historyStack'}
            component={HistoryStackContainer}
            options={{ tabBarLabel: () => <Icon name="book-open" size={14} color="#ccc" /> }}
          />
        )}
        {isBookmarksVisible && (
          <Tab.Screen
            name={'bookmarksStack'}
            component={BookmarksStackContainer}
            options={{ tabBarLabel: () => <Icon name="bookmark" size={14} color="#ccc" /> }}
          />
        )}
        <Tab.Screen
          name={'searchStack'}
          component={SearchStackContainer}
          options={{ tabBarLabel: () => <Icon name="search" size={14} color="#ccc" /> }}
        />
        <Tab.Screen
          name={'mailStack'}
          component={MailStackContainer}
          options={{ tabBarLabel: () => <Icon name="mail" size={14} color="#ccc" /> }}
        />
        <Tab.Screen
          name={'lastPostsStack'}
          component={LastPostsStackContainer}
          options={{ tabBarLabel: () => <Icon name="inbox" size={14} color="#ccc" /> }}
        />
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
      <RootStack.Screen name={'composePost'} component={ComposePost} options={{ title: 'New post' }} />
      <RootStack.Screen name={'tabs'} component={TabContainer} options={{ headerShown: false }} />
    </RootStack.Navigator>
  )
}
