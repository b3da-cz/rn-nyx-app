import DeviceInfo from 'react-native-device-info'
import { Storage } from '../lib'

export const createIssue = async (title, message) => {
  try {
    const conf = await Storage.getAuth()
    if (!conf?.username) {
      return
    }
    const username = conf.username.toUpperCase()
    const res = await fetch('https://api.github.com/repos/b3da-cz/rn-nyx-app/issues', {
      method: 'POST',
      headers: {
        // Accept: 'application/json',
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': `${username} | nnn v${DeviceInfo.getVersion()}`,
      },
      body: {
        title,
        body: `
      __App:__ ${DeviceInfo.getVersion()}\n
      __System:__ ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}\n
      __Device:__ ${DeviceInfo.getModel()}\n
      __User:__ ${username}\n\n
      ---
      __Issue:__\n
      ${message}
      `,
      },
    }).then(resp => resp.json())
    return res
  } catch (e) {
    console.warn(e)
  }
}
