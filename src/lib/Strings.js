import { Platform, NativeModules } from 'react-native'
import strings from '../../strings.json'

export const locale =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager.settings.AppleLocale || NativeModules.SettingsManager.settings.AppleLanguages[0]
    : NativeModules.I18nManager.localeIdentifier

const loc = locale.substr(0, 2)
const s = { ...strings } // eval cant see imported

export const t = key => {
  try {
    const keys = key.split('.')
    let res = 's'
    if (keys?.length > 1) {
      for (const k of keys) {
        res += `['${k}']`
      }
      return eval(res)[loc] // used only for known strings
    } else {
      return strings[key][loc]
    }
  } catch (e) {
    console.warn(e)
  }
}
