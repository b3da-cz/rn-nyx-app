import React, { useContext } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Bookmarks, Discussion } from '../routes'

export const BookmarksStackContainer = ({ navigation, route }) => {
  const BookmarksStack = createStackNavigator()
  const context = useContext(MainContext)
  return (
    <BookmarksStack.Navigator initialRouteName={'bookmarks'} screenOptions={NavOptions.screenOptions(context.theme)}>
      <BookmarksStack.Screen name={'bookmarks'} component={Bookmarks} options={{ headerShown: false }} />
      <BookmarksStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </BookmarksStack.Navigator>
  )
}
