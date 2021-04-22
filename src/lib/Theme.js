import { DarkTheme as PaperDarkTheme, DefaultTheme as PaperDefaultTheme } from 'react-native-paper'
import { DarkTheme, DefaultTheme } from '@react-navigation/native'
import { Styling } from '../lib'

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
// console.warn(CombinedDarkTheme) // TODO: remove
export const CustomDarkTheme = {
  animation: { scale: 1 },
  colors: {
    accent: '#03dac6',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    background: 'rgb(1, 1, 1)',
    border: 'rgb(39, 39, 41)',
    card: 'rgb(18, 18, 18)',
    disabled: 'rgba(255, 255, 255, 0.38)',
    error: '#CF6679',
    notification: 'rgb(255, 69, 58)',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    placeholder: 'rgba(255, 255, 255, 0.54)',
    primary: Styling.colors.primary,
    surface: '#121212',
    text: 'rgb(229, 229, 231)',
  },
  dark: true,
  fonts: {
    light: { fontFamily: 'sans-serif-light', fontWeight: 'normal' },
    medium: { fontFamily: 'sans-serif-medium', fontWeight: 'normal' },
    regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
    thin: { fontFamily: 'sans-serif-thin', fontWeight: 'normal' },
  },
  mode: 'adaptive',
  roundness: 4,
}
