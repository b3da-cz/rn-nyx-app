import DeviceInfo from 'react-native-device-info'
import Bugfender from '@bugfender/rn-bugfender'
import { confirm } from '../component'
import { Storage, t } from '../lib'

export class Nyx {
  constructor(username?) {
    this.username = username
    this.auth = {}
    this.store = {}
    this.appVersion = DeviceInfo.getVersion()
    this.userAgent = `Nnn v${
      this.appVersion
    } | ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()} | ${DeviceInfo.getModel()}`
    this.onLogout = null
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
    this.auth = auth

    if (!this.auth.token || this.auth.token === 'undefined') {
      await this.createAuthToken()
      await Storage.setAuth(this.auth)
    }
    return this.auth
  }

  logout() {
    Storage.removeAll()
    this.deleteAuthToken()
    if (this.onLogout && typeof this.onLogout === 'function') {
      this.onLogout()
    }
  }

  getHeaders(contentType = 'application/json') {
    return {
      Accept: contentType,
      'Content-Type': contentType,
      Authorization: `Bearer ${this.auth.token}`,
      'User-Agent': this.userAgent,
    }
  }

  async createAuthToken() {
    try {
      const res = await fetch(`https://nyx.cz/api/create_token/${this.username}`, {
        method: 'POST',
        headers: {
          'User-Agent': this.userAgent,
        },
      }).then(resp => resp.json())
      this.auth = {
        username: this.username,
        token: res.token,
        confirmationCode: res.confirmation_code,
      }
    } catch (e) {
      this.logError('create token', e)
    }
  }

  async deleteAuthToken() {
    try {
      return await fetch(`https://nyx.cz/api/delete_token/${this.auth.token}`, {
        method: 'POST',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('delete token', e)
    }
  }

  async getBookmarks(includingSeen = true) {
    try {
      const res = await fetch(`https://nyx.cz/api/bookmarks${includingSeen ? '/all' : ''}`, {
        method: 'GET',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      this.store.context = res.context
      this.store.discussions = res?.bookmarks ? res.bookmarks.flatMap(b => b.bookmarks) : []
      return res
    } catch (e) {
      this.logError('get bookmarks', e)
    }
    return null
  }

  async getHistory(showRead = true, showBooked?) {
    try {
      const res = await fetch(
        `https://nyx.cz/api/bookmarks/history?more_results=true&show_read=${showRead}${
          showBooked !== undefined ? `&show_booked=${showBooked}` : ''
        }`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        },
      ).then(resp => resp.json())
      this.store.context = res.context
      this.store.discussions = res.discussions
      return res
    } catch (e) {
      this.logError('get history', e)
    }
    return null
  }

  async getLastPosts(minRating = 0, isRatedByFriends?, isRatedByMe?) {
    try {
      const res = await fetch(
        `https://nyx.cz/api/last${minRating > 0 ? `/min_rating/${minRating}` : ''}${
          isRatedByFriends ? '/rated_by_friends' : ''
        }${isRatedByMe ? '/rated_by_me' : ''}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        },
      ).then(resp => resp.json())
      this.store.context = res.context
      return res
    } catch (e) {
      this.logError('get last posts', e)
    }
    return null
  }

  async getLastDiscussions() {
    try {
      return await fetch('https://nyx.cz/api/last/discussions', {
        method: 'GET',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('get last discussions', e)
    }
    return null
  }

  async search({ phrase, isUnified = false, isUsername = false, limit = 20 }) {
    try {
      const res = await fetch(
        `https://nyx.cz/api/search${isUnified ? '/unified' : isUsername ? '/username/' : ''}${
          isUsername ? phrase : `?search=${phrase}&limit=${limit}`
        }`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        },
      ).then(resp => resp.json())
      if (!isUnified) {
        this.store.context = res.context
      }
      return res
    } catch (e) {
      this.logError('search', e)
    }
    return null
  }

  async getDiscussion(id) {
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      this.store.context = res.context
      this.store.discussions.forEach((d, i) => {
        if (d.discussion_id === id) {
          this.store.discussions[i].detail = {
            updated: +new Date(),
            discussion_common: res.discussion_common,
            posts: res.posts,
            presence: res.presence,
          }
        }
      })
      return res
    } catch (e) {
      this.logError('get discussion', e)
    }
    return null
  }

  async getDiscussionBoard(id) {
    try {
      return await fetch(`https://nyx.cz/api/discussion/${id}/content/home`, {
        method: 'GET',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('get discussion', e)
    }
    return null
  }

  async getMail(queryString = '') {
    try {
      return await fetch(`https://nyx.cz/api/mail${queryString}`, {
        method: 'GET',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('get mail', e)
    }
    return null
  }

  async getReminders(type = 'bookmarks') {
    try {
      return await fetch(`https://nyx.cz/api/${type}/reminders`, {
        method: 'GET',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('get reminders', e)
    }
    return null
  }

  async getWaitingFiles(discussionId?) {
    try {
      return await fetch(`https://nyx.cz/api/${!discussionId ? 'mail' : `discussion/${discussionId}`}/waiting_files`, {
        method: 'GET',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('get waiting files', e)
    }
    return null
  }

  async getNotifications() {
    try {
      return await fetch('https://nyx.cz/api/notifications', {
        method: 'GET',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('get notifications', e)
    }
    return null
  }

  async getRating(post) {
    try {
      return await fetch(`https://nyx.cz/api/discussion/${post.discussion_id}/rating/${post.id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('get rating', e)
    }
    return null
  }

  async castVote(post, vote) {
    // console.warn('cast vote', this.auth, post, vote); // TODO: remove // positive|negative|negative_visible
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${post.discussion_id}/rating/${post.id}/${vote}`, {
        method: 'POST',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      if (res.error && res.code === 'NeedsConfirmation') {
        const isConfirmed = await confirm(t('confirm'), res.message)
        if (isConfirmed) {
          return this.castVote(post, 'negative_visible')
        }
      }
      return res
    } catch (e) {
      this.logError('cast vote', e)
    }
    return null
  }

  async setReminder(discussionId, postId, isReminder) {
    try {
      return await fetch(
        `https://nyx.cz/api/${
          discussionId > 0 ? `discussion/${discussionId}` : 'mail'
        }/reminder/${postId}/${isReminder}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        },
      ).then(resp => resp.json())
    } catch (e) {
      this.logError('cast vote', e)
    }
    return null
  }

  async sendPrivateMessage(recipient, message) {
    const data = { recipient, message }
    try {
      return await fetch('https://nyx.cz/api/mail/send', {
        method: 'POST',
        headers: this.getHeaders('application/x-www-form-urlencoded'),
        body: Object.keys(data)
          .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
          .join('&'),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('send private message', e)
    }
    return null
  }

  async bookmarkDiscussion(discussionId, isBooked, categoryId?) {
    try {
      return await fetch(
        `https://nyx.cz/api/discussion/${discussionId}/bookmark?new_state=${isBooked}${
          categoryId > 0 ? `&category=${categoryId}` : ''
        }`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        },
      ).then(resp => resp.json())
    } catch (e) {
      this.logError('bookmark discussion', e)
    }
    return null
  }

  async rollDice(discussionId, postId) {
    try {
      return await fetch(`https://nyx.cz/api/discussion/${discussionId}/dice/${postId}/roll`, {
        method: 'POST',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('roll dice', e)
    }
    return null
  }

  async rollDiceInHeader(discussionId, contentId) {
    try {
      return await fetch(`https://nyx.cz/api/discussion/${discussionId}/content/dice/${contentId}/roll`, {
        method: 'POST',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('roll dice in header', e)
    }
    return null
  }

  async voteInPoll(discussionId, postId, answers) {
    try {
      return await fetch(`https://nyx.cz/api/discussion/${discussionId}/poll/${postId}/vote/${answers.toString()}`, {
        method: 'POST',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('vote in poll', e)
    }
    return null
  }

  async voteInHeaderPoll(discussionId, contentId, answers) {
    try {
      return await fetch(
        `https://nyx.cz/api/discussion/${discussionId}/content/poll/${contentId}/vote/${answers.toString()}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        },
      ).then(resp => resp.json())
    } catch (e) {
      this.logError('vote in header poll', e)
    }
    return null
  }

  async postToDiscussion(discussionId, text) {
    const data = { content: text }
    try {
      return await fetch(`https://nyx.cz/api/discussion/${discussionId}/send/text`, {
        method: 'POST',
        headers: this.getHeaders('application/x-www-form-urlencoded'),
        body: Object.keys(data)
          .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
          .join('&'),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('post to discussion', e)
    }
    return null
  }

  async deletePost(discussionId, postId) {
    try {
      return await fetch(`https://nyx.cz/api/discussion/${discussionId}/delete/${postId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('delete post', e)
    }
    return null
  }

  async uploadFile(file, discussionId?) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_type', discussionId ? 'discussion_attachment' : 'mail_attachment') // free_file | discussion_attachment | mail_attachment
      formData.append('id_specific', discussionId || 0)
      return await fetch('https://nyx.cz/api/file/upload', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.auth.token}`,
        },
        body: formData,
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('upload file', e)
    }
    return null
  }

  async deleteFile(fileId) {
    try {
      return await fetch(`https://nyx.cz/api/file/delete/${fileId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('delete file', e)
    }
    return null
  }

  async subscribeForFCM(fcmToken) {
    try {
      return await fetch(`https://nyx.cz/api/register_for_notifications/${this.auth.token}/Nnn/${fcmToken}`, {
        method: 'POST',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('fcm sub', e)
    }
    return null
  }

  async unregisterFromFCM(fcmToken) {
    try {
      return await fetch(`https://nyx.cz/api/deregister_notifications/${this.auth.token}/Nnn/${fcmToken}`, {
        method: 'POST',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
    } catch (e) {
      this.logError('fcm sub', e)
    }
    return null
  }

  logError(method, error) {
    Bugfender.e('ERROR_NYX', method + ' | ' + error.stack)
  }
}
