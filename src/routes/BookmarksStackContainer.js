import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavOptions, discussionScreenOptions } from '../lib'
import { Bookmarks, Discussion } from '../routes'

export const BookmarksStackContainer = ({ navigation, route }) => {
  const BookmarksStack = createStackNavigator()
  return (
    <BookmarksStack.Navigator initialRouteName={'bookmarks'} screenOptions={NavOptions.screenOptions}>
      <BookmarksStack.Screen name={'bookmarks'} component={Bookmarks} options={{ headerShown: false }} />
      <BookmarksStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </BookmarksStack.Navigator>
  )
}
