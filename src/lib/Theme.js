import { useEffect } from 'react'
import { Dimensions } from 'react-native'
import { useTheme as rnnUseTheme } from '@react-navigation/native'
import { createPalette } from './Palette'

type FontType = { fontFamily: string, fontWeight: string }
export type Theme = {
  animation: { scale: number },
  colors: {
    accent: string,
    backdrop: string,
    background: string,
    border: string,
    card: string,
    disabled: string,
    error: string,
    notification: string,
    onBackground: string,
    onSurface: string,
    placeholder: string,
    primary: string,
    secondary: string,
    tertiary: string,
    surface: string,
    text: string,
    faded: string,
    link: string,
    ripple: string,
    row: string,
    transparent: string,
  },
  dark: boolean,
  fonts: {
    light: FontType,
    medium: FontType,
    regular: FontType,
    thin: FontType,
  },
  metrics: {
    line: number,
    blocks: {
      small: number,
      medium: number,
      large: number,
      xlarge: number,
      rowDiscussion: number,
    },
    fontSizes: {
      small: number,
      p: number,
      h3: number,
      h2: number,
      h1: number,
    },
    screen: {
      height: number,
      width: number,
    },
  },
  mode: string,
  roundness: number,
}

export const createTheme = (
  isDarkTheme: boolean,
  primaryColor: string,
  secondaryColor: string,
  tertiaryColor: string,
  baseFontSize = 15,
  animationScale = 1,
  roundness = 4,
  mode = 'adaptive',
): Theme => ({
  animation: { scale: animationScale },
  colors: createPalette(isDarkTheme, primaryColor, secondaryColor, tertiaryColor),
  dark: true,
  fonts: {
    light: { fontFamily: 'sans-serif-light', fontWeight: 'normal' },
    medium: { fontFamily: 'sans-serif-medium', fontWeight: 'normal' },
    regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
    thin: { fontFamily: 'sans-serif-thin', fontWeight: 'normal' },
  },
  metrics: {
    line: Math.max(1, baseFontSize / 15),
    blocks: {
      small: baseFontSize / 5,
      medium: baseFontSize / 3,
      large: baseFontSize / 1.333,
      xlarge: baseFontSize * 1.5,
      rowDiscussion: baseFontSize * 2 + 2,
    },
    fontSizes: {
      small: baseFontSize * 0.75,
      p: baseFontSize,
      h3: baseFontSize * 1.25,
      h2: baseFontSize * 1.333,
      h1: baseFontSize * 1.5,
    },
    screen: {
      height: Dimensions.get('screen').height,
      width: Dimensions.get('screen').width,
    },
  },
  mode,
  roundness,
})

export const useTheme = (): Theme => rnnUseTheme()

// helper for class components
export const ThemeAware = ({ setTheme }) => {
  const theme = useTheme()
  useEffect(() => {
    setTheme(theme)
    return () => null
  }, [setTheme, theme])
  return null
}

export const defaultThemeOptions = ['cyan', 'teal', 'coolGray', 15]
