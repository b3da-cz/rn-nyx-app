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
import Icon from 'react-native-vector-icons/Feather'
import { Styling, NavOptions, subscribeFCM } from './lib'
import { HistoryView, ImageModal, MailView, DiscussionView, ComposePostModal, NotificationsView } from './view'

export const Router = ({ nyx, refs }) => {
  const [notificationsUnread, setNotificationsUnread] = useState(0) // todo badge
  useEffect(() => {
    const sub = subscribeFCM(message => {
      switch (message.type) {
        case 'new_mail':
          if (refs?.MailView) {
            refs.MailView.getMessages()
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
      onNavigation={({ discussionId, postId }) => navigation.push('discussion', { discussionId, postId })}
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

  const Gallery = ({ navigation, route }) => {
    const { images, imgIndex } = route.params
    return <ImageModal images={images} imgIndex={imgIndex} isShowing={true} onExit={() => navigation.goBack()} />
  }

  const ComposePost = () => {
    const discussion = nyx.store.discussions.filter(d => d.discussion_id === nyx.store.activeDiscussionId)[0]
    const title = discussion?.full_name
    const uploadedFiles = discussion?.detail?.discussion_common?.waiting_files
    return (
      <ComposePostModal
        title={title}
        uploadedFiles={uploadedFiles}
        activeDiscussionId={nyx.store.activeDiscussionId}
        onSend={() => refs.DiscussionView.reloadDiscussionLatest()}
      />
    )
  }

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

  const TabContainer = () => (
    <Tab.Navigator
      initialRouteName={'main'}
      tabBarPosition={'bottom'}
      lazy={true}
      tabBarOptions={NavOptions.tabBarOptions}>
      <Tab.Screen name={'history'} component={HistoryStackContainer} />
      <Tab.Screen name={'last'} component={Notifications} />
      <Tab.Screen name={'mail'} component={Mail} />
      <Tab.Screen name={'search'} component={Notifications} />
      <Tab.Screen name={'profile'} component={Notifications} />
    </Tab.Navigator>
  )

  return (
    <RootStack.Navigator initialRouteName={'tabs'} mode={'modal'} headerMode={'none'}>
      <RootStack.Screen name={'gallery'} component={Gallery} />
      <RootStack.Screen name={'composePost'} component={ComposePost} />
      <RootStack.Screen name={'tabs'} component={TabContainer} />
    </RootStack.Navigator>
  )
}
