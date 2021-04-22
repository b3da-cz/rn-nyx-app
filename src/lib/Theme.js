import { DarkTheme as PaperDarkTheme, DefaultTheme as PaperDefaultTheme } from 'react-native-paper'
import { DarkTheme, DefaultTheme } from '@react-navigation/native'

export const CombinedDefaultTheme = {
  ...PaperDefaultTheme,
  ...DefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    ...DefaultTheme.colors,
  },
}
export const CombinedDarkTheme = {
  ...PaperDarkTheme,
  ...DarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    ...DarkTheme.colors,
  },
}
