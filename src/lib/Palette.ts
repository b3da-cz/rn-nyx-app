// IBM Elements color palette (https://www.ibm.com/design/language/elements/color/)
export const IBMColorPalette = {
  black: 'rgb(0, 0, 0)',
  white: 'rgb(255, 255, 255)',

  coolGray100: 'rgb(18, 22, 25)',
  coolGray90: 'rgb(33, 39, 42)',
  coolGray80: 'rgb(52, 58, 63)',
  coolGray70: 'rgb(77, 83, 88)',
  coolGray60: 'rgb(105, 112, 119)',
  coolGray50: 'rgb(135, 141, 150)',
  coolGray40: 'rgb(162, 169, 176)',
  coolGray30: 'rgb(193, 199, 205)',
  coolGray20: 'rgb(221, 225, 230)',
  coolGray10: 'rgb(242, 244, 248)',

  red100: 'rgb(45, 7, 9)',
  red90: 'rgb(82, 4, 8)',
  red80: 'rgb(117, 14, 19)',
  red70: 'rgb(162, 25, 31)',
  red60: 'rgb(218, 30, 40)',
  red50: 'rgb(250, 77, 86)',
  red40: 'rgb(255, 131, 137)',
  red30: 'rgb(255, 179, 184)',
  red20: 'rgb(255, 215, 217)',
  red10: 'rgb(255, 241, 241)',

  magenta100: 'rgb(42, 10, 24)',
  magenta90: 'rgb(81, 2, 36)',
  magenta80: 'rgb(116, 9, 55)',
  magenta70: 'rgb(159, 24, 83)',
  magenta60: 'rgb(209, 39, 113)',
  magenta50: 'rgb(238, 83, 150)',
  magenta40: 'rgb(255, 126, 182)',
  magenta30: 'rgb(255, 175, 210)',
  magenta20: 'rgb(255, 214, 232)',
  magenta10: 'rgb(255, 240, 247)',

  purple100: 'rgb(28, 15, 48)',
  purple90: 'rgb(49, 19, 94)',
  purple80: 'rgb(73, 29, 139)',
  purple70: 'rgb(105, 41, 196)',
  purple60: 'rgb(138, 63, 252)',
  purple50: 'rgb(165, 110, 255)',
  purple40: 'rgb(190, 149, 255)',
  purple30: 'rgb(212, 187, 255)',
  purple20: 'rgb(232, 218, 255)',
  purple10: 'rgb(246, 242, 255)',

  blue100: 'rgb(0, 17, 65)',
  blue90: 'rgb(0, 29, 108)',
  blue80: 'rgb(0, 45, 156)',
  blue70: 'rgb(0, 67, 205)',
  blue60: 'rgb(15, 98, 254)',
  blue50: 'rgb(69, 137, 255)',
  blue40: 'rgb(120, 169, 255)',
  blue30: 'rgb(166, 200, 255)',
  blue20: 'rgb(208, 226, 255)',
  blue10: 'rgb(237, 245, 255)',

  cyan100: 'rgb(6, 23, 39)',
  cyan90: 'rgb(1, 39, 73)',
  cyan80: 'rgb(0, 58, 109)',
  cyan70: 'rgb(0, 83, 154)',
  cyan60: 'rgb(0, 114, 195)',
  cyan50: 'rgb(17, 146, 232)',
  cyan40: 'rgb(51, 177, 255)',
  cyan30: 'rgb(130, 207, 255)',
  cyan20: 'rgb(186, 230, 255)',
  cyan10: 'rgb(229, 246, 255)',

  teal100: 'rgb(8, 26, 28)',
  teal90: 'rgb(2, 43, 48)',
  teal80: 'rgb(0, 65, 68)',
  teal70: 'rgb(0, 93, 93)',
  teal60: 'rgb(0, 125, 121)',
  teal50: 'rgb(0, 157, 154)',
  teal40: 'rgb(8, 189, 186)',
  teal30: 'rgb(61, 219, 217)',
  teal20: 'rgb(158, 240, 240)',
  teal10: 'rgb(217, 251, 251)',

  green100: 'rgb(7, 25, 8)',
  green90: 'rgb(2, 45, 13)',
  green80: 'rgb(4, 67, 23)',
  green70: 'rgb(14, 96, 39)',
  green60: 'rgb(25, 128, 56)',
  green50: 'rgb(36, 161, 72)',
  green40: 'rgb(66, 190, 101)',
  green30: 'rgb(111, 220, 140)',
  green20: 'rgb(167, 240, 186)',
  green10: 'rgb(222, 251, 230)',
}

export const withAlpha = (rgb: string, alpha: number): string =>
  rgb.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)

export const rgbToHex = rgbStr => {
  const [r, g, b] = rgbStr.replace('rgb(', '').replace(')', '').split(', ')
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = Number(x).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

export const createPalette = (
  isDarkTheme: boolean,
  primaryColor: string,
  secondaryColor: string,
  tertiaryColor: string,
  surfaceColor: string,
) => ({
  accent: IBMColorPalette[`${primaryColor}${isDarkTheme ? '50' : '70'}`],
  backdrop: withAlpha(IBMColorPalette.coolGray100, 0.5),
  background: isDarkTheme ? IBMColorPalette.black : IBMColorPalette.white,
  border: IBMColorPalette[`coolGray${isDarkTheme ? '80' : '30'}`],
  card: IBMColorPalette[`coolGray${isDarkTheme ? '90' : '10'}`],
  disabled: withAlpha(IBMColorPalette[`coolGray${isDarkTheme ? '10' : '90'}`], 0.5),
  error: IBMColorPalette[`red${isDarkTheme ? '70' : '60'}`],
  notification: IBMColorPalette[`${primaryColor}${isDarkTheme ? '80' : '30'}`],
  onBackground: IBMColorPalette[`${primaryColor}${isDarkTheme ? '10' : '100'}`],
  onSurface: IBMColorPalette[`coolGray${isDarkTheme ? '10' : '100'}`],
  placeholder: withAlpha(IBMColorPalette[`coolGray${isDarkTheme ? '10' : '100'}`], 0.6),
  primary: IBMColorPalette[`${primaryColor}${isDarkTheme ? '70' : '60'}`],
  secondary: IBMColorPalette[`${secondaryColor}${isDarkTheme ? '70' : '60'}`],
  tertiary: IBMColorPalette[`${tertiaryColor}${isDarkTheme ? '80' : '30'}`],
  surface:
    IBMColorPalette[
      `${surfaceColor}${surfaceColor !== 'black' && surfaceColor !== 'white' ? (isDarkTheme ? '100' : '10') : ''}`
    ],
  text: isDarkTheme ? IBMColorPalette.white : IBMColorPalette.black,
  faded: IBMColorPalette[`coolGray${isDarkTheme ? '20' : '80'}`],
  link: IBMColorPalette[`${secondaryColor}${isDarkTheme ? '50' : '70'}`],
  ripple: withAlpha(IBMColorPalette[`${primaryColor}${isDarkTheme ? '50' : '60'}`], 0.4),
  row: IBMColorPalette[`coolGray${isDarkTheme ? '90' : '20'}`],
  transparent: 'transparent',
})
