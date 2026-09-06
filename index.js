/**
 * @format
 */

import 'react-native-gesture-handler'
import { AppRegistry } from 'react-native'
import { enableScreens } from 'react-native-screens'
import App from './App'
import { name as appName } from './app.json'
import { bugfender as bugfenderKey } from './keys.json'
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler'
import { Bugfender } from '@bugfender/rn-bugfender'
import messaging from '@react-native-firebase/messaging'

if (bugfenderKey) {
  Bugfender.init({ appKey: bugfenderKey, overrideConsoleMethods: false })
}

const exceptionhandler = (error, isFatal) => {
  if (isFatal) {
    Bugfender.error('ERROR_FATAL', error.stack)
  } else {
    Bugfender.error('ERROR', error.stack)
  }
}
setJSExceptionHandler(exceptionhandler, true)
setNativeExceptionHandler(exceptionString => {
  Bugfender.error('ERROR_NATIVE', exceptionString)
})

messaging().setBackgroundMessageHandler(async remoteMessage => {
  // console.warn('FCM background', remoteMessage)
  return Promise.resolve()
})

enableScreens()

AppRegistry.registerComponent(appName, () => App)
