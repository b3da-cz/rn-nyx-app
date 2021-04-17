import { Dimensions, StyleSheet } from 'react-native'

export const Styling = {
  colors: {
    primary: '#1292B4',
    white: '#FFF',
    lighter: '#F3F3F3',
    light: '#DAE1E7',
    dark: '#444',
    darker: '#222',
    black: '#000',
  },
  metrics: {
    window: {
      height: Dimensions.get('window').height,
      width: Dimensions.get('window').width,
    },
    screen: {
      height: Dimensions.get('screen').height,
      width: Dimensions.get('screen').width,
    },
    fontSize: {
      XSMALL: 14,
      SMALL: 16,
      MEDIUM: 24,
      LARGE: 32,
      XLARGE: 40,
    },
  },
  groups: {
    themeView: isDarkMode => ({
      backgroundColor: isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
      color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
    }),
    themeComponent: isDarkMode => ({
      backgroundColor: isDarkMode ? Styling.colors.black : Styling.colors.white,
      color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
    }),
    //
    sectionContainer: {
      marginTop: 32,
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '600',
    },
    sectionDescription: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: '400',
    },
    highlight: {
      fontWeight: '700',
    },
    linkContainer: {
      flexWrap: 'wrap',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    link: () => ({
      flex: 2,
      fontSize: 18,
      fontWeight: '400',
      color: Styling.colors.primary,
    }),
    description: {
      flex: 3,
      paddingVertical: 16,
      fontWeight: '400',
      fontSize: 18,
    },
    squareBtn: {
      width: 50,
      height: 50,
      backgroundColor: 'red',
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
}
