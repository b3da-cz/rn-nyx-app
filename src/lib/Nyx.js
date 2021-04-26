import DeviceInfo from 'react-native-device-info'
import { confirm } from '../component'
import { Storage } from '../lib'

export class Nyx {
  constructor(username?) {
    this.username = username
    this.auth = {}
    this.store = {}
    this.userAgent = `Nnn v${DeviceInfo.getVersion()} | ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()} | ${DeviceInfo.getModel()}`
    this.onLogout = null
  }

  async init(username?) {
    if (username) {
      this.username = username
    }
    let auth = await Storage.getAuth()
    // console.warn(auth); // TODO: remove
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
      console.warn('create token error', e)
    }
  }

  async getBookmarks(includingSeen = true) {
    try {
      const res = await fetch(`https://nyx.cz/api/bookmarks${includingSeen ? '/all' : ''}`, {
        method: 'GET',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      this.store.context = res.context
      // this.store.discussions = res.discussions
      return res
    } catch (e) {
      console.warn('get history error', e)
    }
    return null
  }

  async getHistory() {
    try {
      const res = await fetch('https://nyx.cz/api/bookmarks/history/more', {
        method: 'GET',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      this.store.context = res.context
      this.store.discussions = res.discussions
      return res
    } catch (e) {
      console.warn('get history error', e)
    }
    return null
  }

  async getLastPosts(isRatedByFriends?) {
    try {
      const res = await fetch(`https://nyx.cz/api/last${isRatedByFriends ? '/rated_by_friends' : ''}`, {
        method: 'GET',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      this.store.context = res.context
      return res
    } catch (e) {
      console.warn('get last posts error', e)
    }
    return null
  }

  async getLastDiscussions() {
    try {
      const res = await fetch('https://nyx.cz/api/last/discussions', {
        method: 'GET',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      // this.store.context = res.context
      return res
    } catch (e) {
      console.warn('get history error', e)
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
          referrerPolicy: 'no-referrer',
          headers: this.getHeaders(),
        },
      ).then(resp => resp.json())
      if (!isUnified) {
        this.store.context = res.context
      }
      return res
    } catch (e) {
      console.warn('get history error', e)
    }
    return null
  }

  async getDiscussion(id) {
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${id}`, {
        method: 'GET',
        referrerPolicy: 'no-referrer',
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
      console.warn('get history error', e)
    }
    return null
  }

  async getMail(queryString = '') {
    try {
      const res = await fetch(`https://nyx.cz/api/mail${queryString}`, {
        method: 'GET',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('get mail error', e)
    }
    return null
  }

  async getNotifications() {
    try {
      const res = await fetch('https://nyx.cz/api/notifications', {
        method: 'GET',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('get notifications error', e)
    }
    return null
  }

  async getRating(post) {
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${post.discussion_id}/rating/${post.id}`, {
        method: 'GET',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('get rating error', e)
    }
    return null
  }

  async castVote(post, vote) {
    // console.warn('cast vote', this.auth, post, vote); // TODO: remove // positive|negative|negative_visible
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${post.discussion_id}/rating/${post.id}/${vote}`, {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      if (res.error && res.code === 'NeedsConfirmation') {
        const isConfirmed = await confirm('Confirm vote', res.message)
        if (isConfirmed) {
          return this.castVote(post, 'negative_visible')
        }
      }
      return res
    } catch (e) {
      console.warn('cast vote error', e)
    }
    return null
  }

  async sendPrivateMessage(recipient, message) {
    const data = { recipient, message }
    try {
      const res = await fetch('https://nyx.cz/api/mail/send', {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders('application/x-www-form-urlencoded'),
        body: Object.keys(data)
          .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
          .join('&'),
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('send private message error', e)
    }
    return null
  }

  async bookmarkDiscussion(discussionId, isBooked, categoryId?) {
    const data = { discussion_id: discussionId, new_state: isBooked ? 'true' : 'false' }
    if (categoryId > 0) {
      data.category = categoryId
    }
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${discussionId}/bookmark?new_state=${isBooked}`, {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders('application/x-www-form-urlencoded'),
        body: Object.keys(data)
          .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
          .join('&'),
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('bookmark discussion error', e)
    }
    return null
  }

  async postToDiscussion(discussionId, text) {
    const data = { content: text }
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${discussionId}/send/text`, {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders('application/x-www-form-urlencoded'),
        body: Object.keys(data)
          .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
          .join('&'),
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('post to discussion error', e)
    }
    return null
  }

  async deletePost(discussionId, postId) {
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${discussionId}/delete/${postId}`, {
        method: 'DELETE',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('delete post error', e)
    }
    return null
  }

  async uploadFile(file, discussionId?) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_type', discussionId ? 'discussion_attachment' : 'mail_attachment') // free_file | discussion_attachment | mail_attachment
      formData.append('id_specific', discussionId || 0)
      const res = await fetch('https://nyx.cz/api/file/upload', {
        method: 'PUT',
        referrerPolicy: 'no-referrer',
        headers: {
          Authorization: `Bearer ${this.auth.token}`,
        },
        body: formData,
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('upload file error', e)
    }
    return null
  }

  async deleteFile(fileId) {
    try {
      const res = await fetch(`https://nyx.cz/api/file/delete/${fileId}`, {
        method: 'DELETE',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('delete file error', e)
    }
    return null
  }

  async setVisibility(isVisible) {
    // todo nope
    const status = isVisible ? 20 : 10
    console.warn('set visibility ', this.auth, isVisible); // TODO: remove
    try {
      const res = await fetch('https://nyx.cz/api/header', {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
        body: { status },
      }).then(resp => resp.json())
      console.warn(res, this.auth); // TODO: remove
      return res
    } catch (e) {
      console.warn('set visibility error', e)
    }
    return null
  }

  async subscribeForFCM(fcmToken) {
    try {
      const res = await fetch(`https://nyx.cz/api/register_for_notifications/${this.auth.token}/Nnn/${fcmToken}`, {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('fcm sub error', e)
    }
    return null
  }

  async unregisterFromFCM(fcmToken) {
    try {
      const res = await fetch(`https://nyx.cz/api/deregister_notifications/${this.auth.token}/Nnn/${fcmToken}`, {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: this.getHeaders(),
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('fcm sub error', e)
    }
    return null
  }
}
