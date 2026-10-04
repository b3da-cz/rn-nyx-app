import React, { useContext } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, LlmAssistant, Search } from '../routes'

export const SearchStackContainer = () => {
  const SearchStack = createNativeStackNavigator()
  const context = useContext(MainContext)
  return (
    <SearchStack.Navigator initialRouteName={'search'} screenOptions={NavOptions.screenOptions(context.theme)}>
      <SearchStack.Screen name={'search'} component={Search} options={{ headerShown: false }} />
      <SearchStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
      <SearchStack.Screen name={'llm'} component={LlmAssistant} options={discussionScreenOptions} />
    </SearchStack.Navigator>
  )
}
