import DeviceInfo from 'react-native-device-info'

export const createIssue = async (username, title, message) => {
  try {
    const res = fetch('https://api.github.com/repos/b3da-cz/rn-nyx-app/issues', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': `${username} | nnn v${DeviceInfo.getVersion()}`,
      },
      body: {
        title,
        body: `
      __App:__ ${DeviceInfo.getVersion()}\n
      __System:__ ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}\n
      __Device:__ ${DeviceInfo.getModel()}\n\n
      ---
      __Issue:__\n
      ${message}
      `,
      },
    }).then(resp => resp.json())
    console.warn(res) // TODO: remove
    return res
  } catch (e) {
    console.warn(e)
  }
}
