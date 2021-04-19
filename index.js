/**
 * @format
 */

import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import messaging from '@react-native-firebase/messaging'

messaging().setBackgroundMessageHandler(async remoteMessage => {
  // console.warn('FCM background', remoteMessage)
  return Promise.resolve()
})

AppRegistry.registerComponent(appName, () => App)
