/**
 * @format
 * @flow
 */
import React, { useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import 'react-native-gesture-handler'
import { useNavigation } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { RNNotificationBanner } from 'react-native-notification-banner'
import Icon from 'react-native-vector-icons/Feather'
import { Styling, NavOptions, subscribeFCM } from './lib'
import {
  HistoryView,
  ImageModal,
  MailView,
  DiscussionView,
  ComposePostView,
  NotificationsView,
  LastPostsView,
} from './view'

export const Router = ({ nyx, refs }) => {
  let nav = null // meh, there have to be cleaner way to do this outside of root stack, .. except there is not :( ref not working on latest RN-N
  const [notificationsUnread, setNotificationsUnread] = useState(0) // todo badge
  useEffect(() => {
    const sub = subscribeFCM(message => {
      switch (message.type) {
        case 'new_mail':
          RNNotificationBanner.Show({
            title: message.title,
            subTitle: message.body,
            tintColor: Styling.colors.primary,
            duration: 10000,
            withIcon: true,
            icon: <Icon name="mail" size={24} color="#FFFFFF" />,
            onClick: () => refs?.MailView?.getMessages(),
          })

          // if (message.isForegroundMsg && refs?.MailView) {
          //   refs.MailView.getMessages()
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
              tintColor: Styling.colors.secondary,
              duration: 10000,
              withIcon: true,
              icon: <Icon name="mail" size={24} color="#FFFFFF" />,
              onClick: () => nav.navigate('notifications'),
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
  const HistoryStack = createStackNavigator()
  const SearchStack = createStackNavigator() // todo
  const MailStack = createStackNavigator() // todo
  const Tab = createMaterialTopTabNavigator()

  const Discussion = ({ navigation, route }) => {
    const { discussionId, postId } = route.params
    return (
      <DiscussionView
        ref={r => setRef('DiscussionView', r)}
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
      onImages={(images, i) => showImages(navigation, images, i)}
      onNavigation={({ discussionId, postId }) => navigation.navigate('discussion', { discussionId, postId })}
      // onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })} // todo mail nav stack
    />
  )

  const History = ({ navigation }) => (
    <HistoryView onDetailShow={discussionId => navigation.push('discussion', { discussionId })} />
  )

  const Notifications = ({ navigation }) => (
    <NotificationsView
      onImages={(images, i) => showImages(navigation, images, i)}
      onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
    />
  )

  const Last = ({ navigation }) => (
    <LastPostsView
      onImages={(images, i) => showImages(navigation, images, i)}
      onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
    />
  )

  const Gallery = ({ navigation, route }) => {
    const { images, imgIndex } = route.params
    return <ImageModal images={images} imgIndex={imgIndex} isShowing={true} onExit={() => navigation.goBack()} />
  }

  const ComposePost = ({ navigation }) => {
    const discussion = nyx.store.discussions.filter(
      d => Number(d.discussion_id) === Number(nyx.store.activeDiscussionId),
    )[0]
    const title = discussion?.full_name
    const uploadedFiles = discussion?.detail?.discussion_common?.waiting_files
    return (
      <ComposePostView
        title={title}
        uploadedFiles={uploadedFiles}
        activeDiscussionId={nyx.store.activeDiscussionId}
        onSend={() => {
          navigation.goBack()
          refs?.DiscussionView?.reloadDiscussionLatest()
        }}
      />
    )
  }

  const NotificationsStackContainer = ({ navigation, route }) => (
    <NotificationsStack.Navigator initialRouteName={'notifications'} screenOptions={NavOptions.screenOptions}>
      <NotificationsStack.Screen name={'notifications'} component={Notifications} options={{ headerShown: false }} />
      <NotificationsStack.Screen
        name={'discussion'}
        component={Discussion}
        options={{
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              style={{ paddingRight: Styling.metrics.block.medium }}
              accessibilityRole="button"
              onPress={() => navigation.navigate('composePost', route.params)}>
              <Icon name="plus" size={28} color="#ccc" />
            </TouchableOpacity>
          ),
        }}
      />
    </NotificationsStack.Navigator>
  )

  const HistoryStackContainer = ({ navigation, route }) => (
    <HistoryStack.Navigator initialRouteName={'history'} screenOptions={NavOptions.screenOptions}>
      <HistoryStack.Screen name={'history'} component={History} options={{ headerShown: false }} />
      <HistoryStack.Screen
        name={'discussion'}
        component={Discussion}
        options={{
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              style={{ paddingRight: Styling.metrics.block.medium }}
              accessibilityRole="button"
              onPress={() => navigation.navigate('composePost', route.params)}>
              <Icon name="plus" size={28} color="#ccc" />
            </TouchableOpacity>
          ),
        }}
      />
    </HistoryStack.Navigator>
  )

  const LastPostsStackContainer = ({ navigation, route }) => (
    <HistoryStack.Navigator initialRouteName={'last'} screenOptions={NavOptions.screenOptions}>
      <HistoryStack.Screen name={'last'} component={Last} options={{ headerShown: false }} />
      <HistoryStack.Screen
        name={'discussion'}
        component={Discussion}
        options={{
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              style={{ paddingRight: Styling.metrics.block.medium }}
              accessibilityRole="button"
              onPress={() => navigation.navigate('composePost', route.params)}>
              <Icon name="plus" size={28} color="#ccc" />
            </TouchableOpacity>
          ),
        }}
      />
    </HistoryStack.Navigator>
  )

  const TabContainer = ({ navigation }) => {
    nav = navigation
    return (
      <Tab.Navigator
        initialRouteName={'historyStack'}
        tabBarPosition={'bottom'}
        lazy={true}
        tabBarOptions={NavOptions.tabBarOptions}>
        <Tab.Screen
          name={'notificationsStack'}
          component={NotificationsStackContainer}
          options={{ tabBarLabel: () => <Icon name="activity" size={14} color="#ccc" style={{ marginLeft: '75%' }} /> }}
        />
        <Tab.Screen name={'historyStack'} component={HistoryStackContainer} options={{ title: 'History' }} />
        <Tab.Screen name={'last'} component={LastPostsStackContainer} />
        <Tab.Screen name={'mail'} component={Mail} />
        <Tab.Screen name={'search'} component={HistoryStackContainer} />
        <Tab.Screen name={'profile'} component={HistoryStackContainer} />
      </Tab.Navigator>
    )
  }
  return (
    <RootStack.Navigator initialRouteName={'tabs'} mode={'modal'}>
      <RootStack.Screen name={'gallery'} component={Gallery} options={{ headerShown: false }} />
      <RootStack.Screen name={'composePost'} component={ComposePost} options={{ title: 'New post' }} />
      {/*<RootStack.Screen name={'notifications'} component={Notifications} options={{ title: 'Notifications' }} />*/}
      <RootStack.Screen name={'tabs'} component={TabContainer} options={{ headerShown: false }} />
    </RootStack.Navigator>
  )
}
