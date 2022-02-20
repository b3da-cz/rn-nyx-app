import { useEffect } from 'react'
import { Dimensions } from 'react-native'
import { useTheme as rnnUseTheme } from '@react-navigation/native'
import { createPalette } from './Palette'

type FontType = {
  fontFamily: string
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | undefined
}
export type Theme = {
  animation: { scale: number }
  colors: {
    accent: string
    backdrop: string
    background: string
    border: string
    card: string
    disabled: string
    error: string
    notification: string
    onBackground: string
    onSurface: string
    placeholder: string
    primary: string
    secondary: string
    tertiary: string
    surface: string
    text: string
    faded: string
    link: string
    ripple: string
    row: string
    transparent: string
  }
  dark: boolean
  fonts: {
    light: FontType
    medium: FontType
    regular: FontType
    thin: FontType
  }
  metrics: {
    line: number
    blocks: {
      small: number
      medium: number
      large: number
      xlarge: number
      rowDiscussion: number
    }
    fontSizes: {
      small: number
      p: number
      h3: number
      h2: number
      h1: number
    }
    screen: {
      height: number
      width: number
    }
  }
  mode: 'adaptive' | 'exact' | undefined
  roundness: number
}
export type ThemeInit = {
  isDarkTheme: boolean
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  surfaceColor?: string
  backgroundColor?: string
  baseFontSize?: number
  baseBlockSize?: number
  animationScale?: number
  roundness?: number
  mode?: 'adaptive' | 'exact' | undefined
}

export const createTheme = ({
  isDarkTheme,
  primaryColor,
  secondaryColor,
  tertiaryColor,
  surfaceColor,
  backgroundColor,
  baseFontSize = 15,
  baseBlockSize = 15,
  animationScale = 1,
  roundness = 4,
  mode = 'adaptive',
}: ThemeInit): Theme => ({
  animation: { scale: animationScale },
  colors: createPalette(isDarkTheme, primaryColor, secondaryColor, tertiaryColor, surfaceColor, backgroundColor),
  dark: true,
  fonts: {
    light: { fontFamily: 'sans-serif-light', fontWeight: 'normal' },
    medium: { fontFamily: 'sans-serif-medium', fontWeight: 'normal' },
    regular: { fontFamily: 'Verdana', fontWeight: 'normal' },
    // regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
    thin: { fontFamily: 'sans-serif-thin', fontWeight: 'normal' },
  },
  metrics: {
    line: Math.max(1, baseBlockSize / 15),
    blocks: {
      small: baseBlockSize / 5,
      medium: baseBlockSize / 3,
      large: baseBlockSize / 1.333,
      xlarge: baseBlockSize * 1.5,
      rowDiscussion: baseBlockSize * 2 + 2,
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

export const useTheme = (): Theme => <Theme>rnnUseTheme()

// helper for class components
export const ThemeAware = ({ setTheme }) => {
  const theme = useTheme()
  useEffect(() => {
    setTheme(theme)
  }, [setTheme, theme])
  return null
}

export type ThemeOptions = {
  isDarkTheme: boolean
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  surfaceColor?: string
  backgroundColor?: string
  baseFontSize: number
  baseBlockSize: number
}

export const defaultThemeOptions: ThemeOptions = {
  isDarkTheme: true,
  primaryColor: 'cyan',
  secondaryColor: 'teal',
  tertiaryColor: 'teal',
  surfaceColor: 'coolGray',
  backgroundColor: undefined,
  baseFontSize: 15,
  baseBlockSize: 15,
}

export const exportTheme = (themeOptions): string =>
  `nnn://theme::${themeOptions.isDarkTheme},${themeOptions.primaryColor},${themeOptions.secondaryColor},${themeOptions.tertiaryColor},${themeOptions.surfaceColor},${themeOptions.backgroundColor},${themeOptions.baseFontSize},${themeOptions.baseBlockSize}`

export const importTheme = (url: string): ThemeOptions => {
  let o
  try {
    o = url.split('::')[1].split(',')
  } catch (e) {
    o = Array(8)
  }
  return {
    isDarkTheme: o[0] === 'true',
    primaryColor: o[1],
    secondaryColor: o[2],
    tertiaryColor: o[3],
    surfaceColor: o[4] === 'undefined' ? undefined : o[4],
    backgroundColor: o[5] === 'undefined' ? undefined : o[5],
    baseFontSize: Number(o[6]),
    baseBlockSize: Number(o[7]),
  }
}
