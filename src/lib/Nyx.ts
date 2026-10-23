import DeviceInfo from 'react-native-device-info'
import { RNNotificationBanner } from 'react-native-notification-banner'
import { confirm } from '../component'
import { t, showNotificationBanner, Storage } from '../lib'
import { resetMessageDraftMemory } from './messageDrafts'
import { NyxEventsApi } from './NyxEventsApi'
// @ts-ignore
import { gplayTestId, gplayTestToken } from '../../keys.json'

export class Nyx {
  api: NyxEventsApi
  appVersion: string
  userAgent: string
  username?: string
  lastError = ''
  holdErrorDepth = 0
  heldError = ''
  heldServedFromCache = false
  constructor(username?) {
    this.username = username
    this.appVersion = DeviceInfo.getVersion()
    this.userAgent = `Nnn v${
      this.appVersion
    } | ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()} | ${DeviceInfo.getModel()}`
    this.api = new NyxEventsApi({ appName: this.userAgent })
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
    resetMessageDraftMemory()
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

  holdErrors() {
    this.holdErrorDepth += 1
  }

  // One failed request can emit the same error twice. Hold those, then show a single
  // banner. When the screen fell back to cache, that banner also says so.
  releaseErrors(servedFromCache = false) {
    if (servedFromCache) {
      this.heldServedFromCache = true
    }
    if (this.holdErrorDepth === 0) {
      return
    }
    this.holdErrorDepth -= 1
    if (this.holdErrorDepth > 0) {
      return
    }
    const msg = this.heldError
    const served = this.heldServedFromCache
    this.heldError = ''
    this.heldServedFromCache = false
    if (!msg) {
      return
    }
    const servedLine = t('profile.discussionCacheServed')
    this.showErrorBanner(served ? `${msg}\n${servedLine}` : msg, msg)
  }

  showNotification(msg) {
    this.lastError = msg || ''
    if (this.holdErrorDepth > 0) {
      this.heldError = msg || this.heldError
      return
    }
    this.showErrorBanner(msg, msg)
  }

  showErrorBanner(body: string, raw = '') {
    showNotificationBanner({
      title: 'Error',
      body,
      tintColor: '#FF0000',
      textColor: '#FFFFFF',
      icon: 'alert-circle',
      onClick: async () => {
        if (raw === 'Invalid token') {
          this.logout()
        }
        RNNotificationBanner.Dismiss()
      },
    })
  }
}
