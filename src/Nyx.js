import DeviceInfo from 'react-native-device-info'
import { confirm, Storage } from './'

export class Nyx {
  constructor(userId) {
    this.userUd = userId
    this.auth = {}
    this.store = {}
    // this.auth = {
    //   token: window.localStorage.getItem('nyx_auth_token'),
    //   confirmationCode: window.localStorage.getItem('nyx_auth_confirmation_code'),
    // }
    this.userAgent = `Nnn v${DeviceInfo.getVersion()} | ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()} | ${DeviceInfo.getModel()}`
    this.init()
  }

  async init() {
    let auth = await Storage.getAuth()
    // console.warn({auth}, `${DeviceInfo.getVersion()} | ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()} | ${DeviceInfo.getModel()}`); // TODO: remove
    let isAuthConfirmed = true
    if (!auth) {
      // auth = {
      //   token: 'ZwiO3LfRjljXTT7ZpOEgBzAaMuKd27VA', // todo
      //   confirmationCode: 'jbRVnSAp',
      // }
      auth = {
        token: null,
        confirmationCode: null,
      }
    }
    this.auth = auth

    if (!this.auth.token || this.auth.token === 'undefined') {
      isAuthConfirmed = await this.createAuthToken() // todo test and cleanup heavily
      if (isAuthConfirmed) {
        await Storage.setAuth(this.auth)
      }
    }
  }

  async createAuthToken() {
    console.warn('create token', this.auth); // TODO: remove
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
      window.localStorage.setItem('nyx_auth_token', this.auth.token)
      window.localStorage.setItem('nyx_auth_confirmation_code', this.auth.confirmationCode)
      console.warn(res, this.auth); // TODO: remove
      const isAuthConfirmed = await confirm('Confirm auth in Nyx settings', `Open nyx.cz -> user settings -> auth -> update confirmation code for app: "${this.auth.confirmationCode}"\nTHEN press OK`)
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
      // post_type: 'dice'
      const dicepost = {
        "id": 53597470,
        "discussion_id": 5989,
        "username": "B3DA",
        "content": "<div class=\"pc pc-dice\"><h2>foobaz</h2><br><div class=control-group><button type=button name=roll >Hodit! | <b>1d6+</b></button></div></div>",
        "content_raw": {
          "type": "dice",
          "data": {
            "reason": "foobaz",
            "dice_count": 1,
            "dice_sides": 6,
            "additional_rolls": true,
            "rolls": [],
            "computed_values": {
              "can_modify": true,
              "user_did_roll": false
            }
          }
        },
        "post_type": "dice",
        "inserted_at": "2021-04-18T02:14:21",
        "activity": {
          "username": "B3DA",
          "last_activity": "2021-04-18T02:15:31",
          "last_access_method": "Api",
          "status": "Invisible",
          "location": "4:44:44 # KDO BUDE DŘÍV?  # ╔╦╬╦╗ (cti hrabe) # PICHACKY NYXU",
          "location_url": "/discussion/5989"
        },
        "can_be_deleted": true,
        "can_be_reminded": true
      }
      const dice2withtime = {
        "type": "dice",
        "data": {
          "reason": "foobar",
          "dice_count": 1,
          "dice_sides": 12,
          "additional_rolls": false,
          "allow_rolls_until": "2021-04-18T04:45:00",
          "show_rolls_after": "2021-04-18T16:45:00",
          "rolls": [
            {
              "user": {
                "username": "B3DA"
              },
              "rolls": [
                10
              ]
            }
          ],
          "computed_values": {
            "can_modify": true,
            "user_did_roll": true
          }
        }
      }

      // post_type === 'poll'
      const pollUnanswered = {
        "id": 53575215,
        "discussion_id": 19551,
        "username": "SKAFF",
        "content": "<div class=\"pc pc-poll\"><h2>žiju:</h2>47 hlasy od 47 respondentů<br><ul><li><label><input type=\"radio\" name=answer value=\"1\" > na stejném místě &#x2f; městě &#x2f; vesnici &#x2f; kde jsem se &quot;narodil&#x2f;a&quot;</label></li><li><label><input type=\"radio\" name=answer value=\"2\" > v jiném městě &#x2f; místě &#x2f; vesnici</label></li><li><label><input type=\"radio\" name=answer value=\"3\" > v jiné zemi</label></li><li><label><input type=\"radio\" name=answer value=\"4\" > _</label></li></ul><br><div class=control-group><button type=button name=vote >Veřejně hlasovat</button></div></div>",
        "content_raw": {
          "type": "poll",
          "data": {
            "question": "žiju:",
            "public_results": true,
            "allowed_votes": 1,
            "answers": {
              "1": {
                "answer": "na stejném místě / městě / vesnici / kde jsem se \"narodil/a\""
              },
              "2": {
                "answer": "v jiném městě / místě / vesnici"
              },
              "3": {
                "answer": "v jiné zemi"
              },
              "4": {
                "answer": "_"
              }
            },
            "computed_values": {
              "can_modify": false,
              "user_did_vote": false,
              "total_votes": 47,
              "total_respondents": 47,
              "maximum_answer_votes": 30
            }
          }
        },
        "post_type": "poll",
        "rating": 1,
        "inserted_at": "2021-04-12T12:06:16",
        "can_be_rated": true,
        "can_be_reminded": true
      }
      const answeredPoll_content_raw = {
        "type": "poll",
        "data": {
          "question": "Dezinfikovali jste si od začátku covidu klíče od bytu / dopravního prostředku",
          "public_results": true,
          "allowed_votes": 1,
          "allow_answers_until": "2021-05-11T00:00:00",
          "show_answers_after": "2021-04-12T08:00:00",
          "answers": {
            "1": {
              "answer": "Ano",
              "result": {
                "respondents_count": 16,
                "respondents": [
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {}
                ]
              }
            },
            "2": {
              "answer": "Ne",
              "result": {
                "respondents_count": 60,
                "respondents": [
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {},
                  {}
                ]
              }
            },
            "3": {
              "answer": "Dezinfikuji pravidelně",
              "result": {
                "respondents_count": 3,
                "respondents": [
                  {},
                  {},
                  {}
                ]
              }
            }
          },
          "computed_values": {
            "can_modify": false,
            "user_did_vote": false,
            "total_votes": 79,
            "total_respondents": 79,
            "maximum_answer_votes": 60
          }
        }
      }
      this.store.context = res.context
      // console.warn(res.context); // TODO: remove
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
      return res
    } catch (e) {
      console.warn('get notifications error', e); // TODO: remove
    }
    return null
  }

  async postToDiscussion(discussionId, text) {
    const data = { content: text }
    // console.warn('post ', this.auth, discussionId, text, new URLSearchParams({
    //   content: text,
    // }), Object.keys(data).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key])).join('&')); // TODO: remove
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${discussionId}/send/text`, {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: {
          'Accept': 'application/x-www-form-urlencoded',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${this.auth.token}`,
        },
        body: Object.keys(data).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key])).join('&'),
      }).then(resp => resp.json())
      // console.warn(res, this.auth); // TODO: remove
      return res
    } catch (e) {
      console.warn('get notifications error', e); // TODO: remove
    }
    return null
  }

  async deletePost(discussionId, postId) {
    // console.warn('delete post ', this.auth, discussionId, postId); // TODO: remove
    try {
      const res = await fetch(`https://nyx.cz/api/discussion/${discussionId}/delete/${postId}`, {
        method: 'DELETE',
        referrerPolicy: 'no-referrer',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`,
        },
      }).then(resp => resp.json())
      // console.warn(res, this.auth); // TODO: remove
      return res
    } catch (e) {
      console.warn('get notifications error', e); // TODO: remove
    }
    return null
  }

  async uploadFile(discussionId, file) {
    // console.warn('upload file ', this.auth, discussionId, file, file.type); // TODO: remove
    try {
      const formData = new FormData()
      // formData.append('blob', new Blob(['Hello World!\n']), 'test')
      formData.append('file', file)
      // formData.append('file', new Blob([file]))
      formData.append('file_type', 'discussion_attachment') // mail_attachment
      formData.append('id_specific', discussionId)
      const res = await fetch(`https://nyx.cz/api/file/upload`, {
        method: 'PUT',
        referrerPolicy: 'no-referrer',
        headers: {
          // 'Accept': 'application/json',
          // 'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${this.auth.token}`,
        },
        body: formData,
      }).then(resp => resp.json())
      // console.warn(res, this.auth); // TODO: remove
      return res
    } catch (e) {
      console.warn('get notifications error', e); // TODO: remove
    }
    return null
  }

  async deleteFile(fileId) {
    // console.warn('delete file ', this.auth, discussionId, fileId); // TODO: remove
    try {
      const res = await fetch(`https://nyx.cz/api/file/delete/${fileId}`, {
        method: 'DELETE',
        referrerPolicy: 'no-referrer',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`,
        },
      }).then(resp => resp.json())
      // console.warn(res, this.auth); // TODO: remove
      return res
    } catch (e) {
      console.warn('get notifications error', e); // TODO: remove
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
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`,
        },
        body: { status },
      }).then(resp => resp.json())
      console.warn(res, this.auth); // TODO: remove
      return res
    } catch (e) {
      console.warn('get notifications error', e); // TODO: remove
    }
    return null
  }

  async subscribeForFCM(fcmToken) {
    // console.warn('register for FCM ', this.auth, fcmToken); // TODO: remove
    try {
      const res = await fetch(`https://nyx.cz/api/register_for_notifications/${this.auth.token}/Nnn/${fcmToken}`, {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`,
        },
      }).then(resp => resp.json())
      // console.warn(res, this.auth); // TODO: remove
      return res
    } catch (e) {
      console.warn('fcm sub error', e); // TODO: remove
    }
    return null
  }
}
