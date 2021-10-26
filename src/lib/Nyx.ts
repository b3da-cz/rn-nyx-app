import DeviceInfo from 'react-native-device-info'
import { RNNotificationBanner } from 'react-native-notification-banner'
import { confirm } from '../component'
import { t, showNotificationBanner, Storage } from '../lib'
import NyxApi from 'nyx-api'
// @ts-ignore
import { gplayTestId, gplayTestToken } from '../../keys.json'

export class Nyx {
  api: NyxApi
  appVersion: string
  userAgent: string
  username?: string
  constructor(username?) {
    this.username = username
    this.appVersion = DeviceInfo.getVersion()
    this.userAgent = `Nnn v${
      this.appVersion
    } | ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()} | ${DeviceInfo.getModel()}`
    this.api = new NyxApi({ appName: this.userAgent })
    this.api.onError.subscribe().then(msg => {
      if (!msg.includes('Hlas bude pro uživatele viditelný.')) {
        this.showNotification(msg)
      }
    })
  }

  async init(username?) {
    if (username) {
      this.username = username
    }
    let auth = await Storage.getAuth()
    if (!auth) {
      auth = {
        username: this.username,
        token: null,
        confirmationCode: null,
        isConfirmed: false,
      }
    }
    if (username?.toLowerCase() === gplayTestId.toLowerCase()) {
      auth.token = gplayTestToken
      auth.isConfirmed = true
      await Storage.setAuth(auth)
    }

    if ((!auth.token || auth.token === 'undefined') && this.username) {
      auth = await this.api.createAuthToken(this.username)
      auth.isConfirmed = false
      await Storage.setAuth(auth)
    } else if (auth.token.length > 9 && this.username) {
      this.api.setAuth(auth)
    }
    return auth
  }

  logout() {
    Storage.removeAll()
    this.api.deleteAuthToken()
    this.api.logout()
  }

  async ratePost(post, vote) {
    const res = await this.api.ratePost(post, vote)
    if (res?.error && res.code === 'NeedsConfirmation') {
      const isConfirmed = await confirm(t('confirm'), res?.message || 'Potvrď viditelný negativní hlas')
      if (isConfirmed) {
        return this.ratePost(post, 'negative_visible')
      }
    }
    return res
  }

  showNotification(msg) {
    showNotificationBanner({
      title: 'Error',
      body: msg,
      tintColor: '#FF0000',
      textColor: '#FFFFFF',
      icon: 'alert-circle',
      onClick: async () => {
        if (msg === 'Invalid token') {
          this.logout()
        }
        RNNotificationBanner.Dismiss()
      },
    })
  }
}
