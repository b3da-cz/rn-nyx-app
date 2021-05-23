import { createPalette } from './Palette'

export const createTheme = (
  isDarkTheme: boolean,
  primaryColor: string,
  secondaryColor: string,
  tertiaryColor: string,
  animationScale = 1,
  roundness = 4,
  mode = 'adaptive',
) => ({
  animation: { scale: animationScale },
  colors: createPalette(isDarkTheme, primaryColor, secondaryColor, tertiaryColor),
  dark: true,
  fonts: {
    light: { fontFamily: 'sans-serif-light', fontWeight: 'normal' },
    medium: { fontFamily: 'sans-serif-medium', fontWeight: 'normal' },
    regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
    thin: { fontFamily: 'sans-serif-thin', fontWeight: 'normal' },
  },
  mode,
  roundness,
})
