/**
 * @format
 */

import { AppRegistry } from 'react-native'
import { enableScreens } from 'react-native-screens'
import App from './App'
import { name as appName } from './app.json'
import { bugfender as bugfenderKey } from './keys.json'
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler'
import Bugfender from '@bugfender/rn-bugfender'
import messaging from '@react-native-firebase/messaging'

Bugfender.init(bugfenderKey)

const exceptionhandler = (error, isFatal) => {
  if (isFatal) {
    Bugfender.e('ERROR_FATAL', error.stack)
  } else {
    Bugfender.e('ERROR', error.stack)
  }
}
setJSExceptionHandler(exceptionhandler, true)
setNativeExceptionHandler(exceptionString => {
  Bugfender.e('ERROR_NATIVE', exceptionString)
})

messaging().setBackgroundMessageHandler(async remoteMessage => {
  // console.warn('FCM background', remoteMessage)
  return Promise.resolve()
})

enableScreens()

AppRegistry.registerComponent(appName, () => App)
