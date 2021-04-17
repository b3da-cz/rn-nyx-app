export class Nyx {
  constructor(userId) {
    this.userUd = userId
    this.auth = {
      token: 'ZwiO3LfRjljXTT7ZpOEgBzAaMuKd27VA',
      confirmationCode: 'jbRVnSAp',
    }
    this.store = {}
    // this.auth = {
    //   token: window.localStorage.getItem('nyx_auth_token'),
    //   confirmationCode: window.localStorage.getItem('nyx_auth_confirmation_code'),
    // }
    this.init()
  }

  async init() {
    let isAuthConfirmed = true
    if (!this.auth.token || this.auth.token === 'undefined') {
      isAuthConfirmed = await this.createAuthToken()
    }
    // console.warn({isAuthConfirmed}); // TODO: remove
    if (isAuthConfirmed) {
      // const history = await this.getNotifications()
      // console.warn({history}); // TODO: remove
    }
  }

  async createAuthToken() {
    console.warn('create token', this.auth); // TODO: remove
    try {
      const res = await fetch(`https://nyx.cz/api/create_token/${this.userUd}`, {
        method: 'POST',
      }).then(resp => resp.json())
      this.auth = {
        token: res.token,
        confirmationCode: res.confirmation_code,
      }
      window.localStorage.setItem('nyx_auth_token', this.auth.token)
      window.localStorage.setItem('nyx_auth_confirmation_code', this.auth.confirmationCode)
      console.warn(res, this.auth); // TODO: remove
      const isAuthConfirmed = confirm(`Open nyx.cz -> user settings -> auth -> update confirmation code for app: "${this.auth.confirmationCode}"\nTHEN press OK`)
      // console.warn(isAuthConfirmed); // TODO: remove
      if (isAuthConfirmed) {
        return true
      }
    } catch (e) {
      console.warn('create token error', e); // TODO: remove
    }
    return false
  }

  async getHistory() {
    // console.warn('get history', this.auth); // TODO: remove
    try { // todo cors
      const res = await fetch(`https://nyx.cz/api/bookmarks/history/more`, {
      // const res = await fetch(`//localhost:3000/api/bookmarks/history/`, {
        method: 'GET',
        // referrerPolicy: 'origin-when-cross-origin',
        referrerPolicy: 'no-referrer',
        // referrerPolicy: 'unsafe-url',
        // referrer: 'https://nyx.cz',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`,
        },
      }).then(resp => resp.json())
      // console.warn(res, this.auth); // TODO: remove
      const r = {
        context: {
          active_friends: [],
          user: {
            mail_last_from: "BADHORSE",
            mail_unread: 0,
            notifications_last_visit: "2021-04-10T18:41:58",
            notifications_unread: 0,
            username: "B3DA",
          }
        },
        discussions: [{
          discussion_id: 1,
          full_name: "nyx :: pripominky uzivatelu",
          last_visited_at: "2021-04-13T10:07:01",
          new_images_count: 14,
          new_links_count: 8,
          new_posts_count: 138,
        }],
      }
      this.store.context = res.context
      this.store.discussions = res.discussions
      return res
    } catch (e) {
      console.warn('get history error', e); // TODO: remove
    }
    return null
  }

  async getDiscussion(id) {
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${id}`, {
        method: 'GET',
        referrerPolicy: 'no-referrer',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`,
        },
      }).then(resp => resp.json())
      // console.warn(res, this.auth); // TODO: remove
      const r = {
        context: {
       //...
        },
        discussion_common: {
          //discussion_specific_data.header:[content/content_raw.data],
        },
        posts:[{
          id: 53592945,
          inserted_at: "2021-04-16T13:23:06",
          username: "MARTYYNO",
          content: '....',
        }],
        presence:[{user: 'foo', freshness: 0.45}],
      }
      // this.store.context = res.context
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
      console.warn('get history error', e); // TODO: remove
    }
    return null
  }

  async getNotifications() {
    // console.warn('get history', this.auth); // TODO: remove
    try { // todo cors
      const res = await fetch(`https://nyx.cz/api/notifications/`, {
        method: 'GET',
        referrerPolicy: 'no-referrer',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`,
        },
      }).then(resp => resp.json())
      console.warn(res, this.auth); // TODO: remove
      const r = {
        context: {
          active_friends: [],
          user: {
            mail_last_from: "BADHORSE",
            mail_unread: 0,
            notifications_last_visit: "2021-04-10T18:41:58",
            notifications_unread: 0,
            username: "B3DA",
          }
        },
      //   notifications: Array(16)
      //   0:
      //   data: {id: 53140801, discussion_id: 12298, domain_id: 5, discussion_name: "FOTO.blog - daybook vasich fotografii - Be creative! Obey the rules!", user_id: 45098, …}
      // details:
      //   thumbs_up: Array(2)
      // 0:
      // inserted_at: "2021-04-10T10:11:12"
      // username: "PANDAMON"
        discussions: [{
          discussion_id: 1,
          full_name: "nyx :: pripominky uzivatelu",
          last_visited_at: "2021-04-13T10:07:01",
          new_images_count: 14,
          new_links_count: 8,
          new_posts_count: 138,
        }],
      }
      return res
    } catch (e) {
      console.warn('get notifications error', e); // TODO: remove
    }
    return null
  }

  async getRating(post) {
    // console.warn('get rating', this.auth, post); // TODO: remove
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${post.discussion_id}/rating/${post.id}`, {
        method: 'GET',
        referrerPolicy: 'no-referrer',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`,
        },
      }).then(resp => resp.json())
      // console.warn(res, this.auth); // TODO: remove
      const r = [{username: '...', tag: 'positive'}]
      return res
    } catch (e) {
      console.warn('get rating error', e); // TODO: remove
    }
    return null
  }

  async castVote(post, vote) {
    console.warn('cast vote', this.auth, post, vote); // TODO: remove // positive|negative|negative_visible
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${post.discussion_id}/rating/${post.id}/${vote}`, {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`,
        },
      }).then(resp => resp.json())
      console.warn(res, this.auth); // TODO: remove
      const r = {
        context: {
          active_friends: [],
          user: {
            mail_last_from: "BADHORSE",
            mail_unread: 0,
            notifications_last_visit: "2021-04-10T18:41:58",
            notifications_unread: 0,
            username: "B3DA",
          }
        },
      //   notifications: Array(16)
      //   0:
      //   data: {id: 53140801, discussion_id: 12298, domain_id: 5, discussion_name: "FOTO.blog - daybook vasich fotografii - Be creative! Obey the rules!", user_id: 45098, …}
      // details:
      //   thumbs_up: Array(2)
      // 0:
      // inserted_at: "2021-04-10T10:11:12"
      // username: "PANDAMON"
        discussions: [{
          discussion_id: 1,
          full_name: "nyx :: pripominky uzivatelu",
          last_visited_at: "2021-04-13T10:07:01",
          new_images_count: 14,
          new_links_count: 8,
          new_posts_count: 138,
        }],
      }
      return res
    } catch (e) {
      console.warn('get notifications error', e); // TODO: remove
    }
    return null
  }
}
