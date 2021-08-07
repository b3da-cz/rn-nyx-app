import React, { useContext } from 'react'
import { createNativeStackNavigator } from 'react-native-screens/native-stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Search } from '../routes'

export const SearchStackContainer = () => {
  const SearchStack = createNativeStackNavigator()
  const context = useContext(MainContext)
  return (
    <SearchStack.Navigator initialRouteName={'search'} screenOptions={NavOptions.screenOptions(context.theme)}>
      <SearchStack.Screen name={'search'} component={Search} options={{ headerShown: false }} />
      <SearchStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </SearchStack.Navigator>
  )
}
