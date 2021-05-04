import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Search } from '../routes'

export const SearchStackContainer = ({ navigation, route }) => {
  const SearchStack = createStackNavigator()
  return (
    <SearchStack.Navigator initialRouteName={'search'} screenOptions={NavOptions.screenOptions}>
      <SearchStack.Screen name={'search'} component={Search} options={{ headerShown: false }} />
      <SearchStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </SearchStack.Navigator>
  )
}
