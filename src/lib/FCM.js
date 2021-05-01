import messaging from '@react-native-firebase/messaging'
import { Storage } from '../lib'

export const initFCM = async (nyx, config, isAuthenticated) => {
  if (!isAuthenticated) {
    return
  }
  try {
    if (!config.isFCMSubscribed) {
      const fcmToken = await messaging().getToken()
      const subFCMRes = await nyx.subscribeForFCM(fcmToken)
      config.fcmToken = fcmToken
      config.isFCMSubscribed = !subFCMRes.error
      await Storage.setConfig(config)
    }
  } catch (e) {
    console.warn(e)
  }
}

export const unregisterFCM = async (nyx, config, isAuthenticated) => {
  if (!isAuthenticated) {
    return
  }
  try {
    const fcmToken = await messaging().getToken()
    const unsubFCMRes = await nyx.unregisterFromFCM(fcmToken)
    config.isFCMSubscribed = false
    await Storage.setConfig(config)
    return unsubFCMRes
  } catch (e) {
    console.warn(e)
  }
}

export const subscribeFCM = async onMessage => {
  try {
    const processMessage = (message, isForegroundMsg = false) => {
      if (message && message.data) {
        // console.warn(message, isForegroundMsg)
        onMessage && typeof onMessage === 'function'
          ? onMessage({
              isForegroundMsg,
              type: message.data.type,
              discussionId: message.data.discussion_id,
              postId: message.data.post_id,
              title: message.notification.title,
              body: message.notification.body,
            })
          : null
      }
    }
    return {
      backgroundNotificationListener: messaging().onNotificationOpenedApp(async message => {
        processMessage(message)
      }),
      closedAppNotificationListener: messaging()
        .getInitialNotification()
        .then(message => {
          processMessage(message)
        }),
      onMessageListener: messaging().onMessage(message => {
        processMessage(message, true)
      }),
    }
  } catch (e) {
    console.warn(e)
  }
  return null
}
