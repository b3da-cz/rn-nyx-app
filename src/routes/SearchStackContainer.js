import React, { useContext } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Search } from '../routes'

export const SearchStackContainer = ({ navigation, route }) => {
  const SearchStack = createStackNavigator()
  const context = useContext(MainContext)
  return (
    <SearchStack.Navigator
      initialRouteName={'search'}
      screenOptions={NavOptions.screenOptions(context.theme === 'dark')}>
      <SearchStack.Screen name={'search'} component={Search} options={{ headerShown: false }} />
      <SearchStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </SearchStack.Navigator>
  )
}
