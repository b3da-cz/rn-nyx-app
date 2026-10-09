import { Platform, NativeModules } from 'react-native'
import strings from '../../strings.json'

export const locale =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
      'cs_CZ'
    : NativeModules.I18nManager?.localeIdentifier || 'cs_CZ'

let appLanguage: 'auto' | 'cs' | 'en' = 'auto'

export const setAppLanguage = (lang: string) => {
  appLanguage = (lang as any) || 'auto'
}

export const getAppLanguage = (): string => appLanguage

export const getActiveLanguage = (): 'cs' | 'en' => {
  if (appLanguage === 'cs' || appLanguage === 'en') {
    return appLanguage
  }
  const sys = (locale || '').substr(0, 2).toLowerCase()
  return sys === 'cs' || sys === 'sk' ? 'cs' : 'en'
}

export const loc = locale.substr(0, 2)

export function t(key) {
  // @ts-ignore
  this.s = { ...strings } // eval cant see imported
  const currentLoc = getActiveLanguage()
  try {
    const keys = key.split('.')
    let res = 'this.s'
    if (keys?.length > 1) {
      for (const k of keys) {
        res += `['${k}']`
      }
      // eslint-disable-next-line no-eval
      return eval(res)[currentLoc] // used only for known strings
    } else {
      return strings[key]?.[currentLoc] || strings[key]?.cs || strings[key]?.en
    }
  } catch (e) {
    console.warn(e)
  }
}
