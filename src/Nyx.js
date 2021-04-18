import DeviceInfo from 'react-native-device-info'
import { confirm, Storage } from './'

export class Nyx {
  constructor(userId) {
    this.userUd = userId
    this.auth = {}
    this.store = {}
    this.userAgent = `Nnn v${DeviceInfo.getVersion()} | ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()} | ${DeviceInfo.getModel()}`
    this.init()
  }

  async init() {
    let auth = await Storage.getAuth()
    let isAuthConfirmed = true
    if (!auth) {
      auth = {
        token: null,
        confirmationCode: null,
      }
    }
    this.auth = auth

    if (!this.auth.token || this.auth.token === 'undefined') {
      isAuthConfirmed = await this.createAuthToken()
      if (isAuthConfirmed) {
        await Storage.setAuth(this.auth)
      }
    }
  }

  getHeaders(contentType = 'application/json') {
    return {
      'Accept': contentType,
      'Content-Type': contentType,
      'Authorization': `Bearer ${this.auth.token}`,
      'User-Agent': this.userAgent,
    }
  }

  async createAuthToken() {
    try {
      const res = await fetch(`https://nyx.cz/api/create_token/${this.userUd}`, {
        method: 'POST',
        headers: {
          'User-Agent': this.userAgent,
        },
      }).then(resp => resp.json())
      this.auth = {
        token: res.token,
        confirmationCode: res.confirmation_code,
      }
      const isAuthConfirmed = await confirm(
        'Confirm auth in Nyx settings',
        `Open nyx.cz -> user settings -> auth -> update confirmation code for app: "${this.auth.confirmationCode}"\nTHEN press OK`,
      )
      if (isAuthConfirmed) {
        return true
      }
    } catch (e) {
      console.warn('create token error', e)
    }
    return false
  }

  async getHistory() {
    try {
      const res = await fetch(`https://nyx.cz/api/bookmarks/history/more`, {
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

  async getNotifications() {
    try {
      const res = await fetch(`https://nyx.cz/api/notifications/`, {
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
      console.warn(res, this.auth); // TODO: remove
      return res
    } catch (e) {
      console.warn('get notifications error', e)
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

  async uploadFile(discussionId, file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_type', 'discussion_attachment') // free_file | discussion_attachment | mail_attachment
      formData.append('id_specific', discussionId)
      const res = await fetch(`https://nyx.cz/api/file/upload`, {
        method: 'PUT',
        referrerPolicy: 'no-referrer',
        headers: {
          'Authorization': `Bearer ${this.auth.token}`,
        },
        body: formData,
      }).then(resp => resp.json())
      return res
    } catch (e) {
      console.warn('upload file error', e); // TODO: remove
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

  async setVisibility(isVisible) { // todo nope
    const status = isVisible ? 20 : 10
    console.warn('set visibility ', this.auth, isVisible); // TODO: remove
    try {
      const res = await fetch(`https://nyx.cz/api/header`, {
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
}
