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

// setJSExceptionHandler patches console.error to call this handler, and Bugfender.error prints
// via console.error, so without the guard any error recurses until the stack overflows.
let handlingException = false
const exceptionhandler = (error, isFatal) => {
  if (handlingException) {
    return
  }
  handlingException = true
  try {
    Bugfender.error(isFatal ? 'ERROR_FATAL' : 'ERROR', error?.stack ?? String(error))
  } finally {
    handlingException = false
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
