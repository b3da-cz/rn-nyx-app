import { Dimensions } from 'react-native'

export const Styling = {
  colors: {
    primary: '#1292B4',
    secondary: '#b46612',
    accent: '#43E6DD',
    white: '#FFF',
    lighter: '#F3F3F3',
    light: '#DAE1E7',
    dark: '#444',
    darker: '#222',
    black: '#000',
  },
  metrics: {
    window: () => ({
      height: Dimensions.get('window').height,
      width: Dimensions.get('window').width,
    }),
    screen: () => ({
      height: Dimensions.get('screen').height,
      width: Dimensions.get('screen').width,
    }),
    block: {
      xxsmall: 1,
      xsmall: 3,
      small: 5,
      medium: 10,
      large: 20,
      xlarge: 30,
      xxlarge: 50,
    },
    fontSize: {
      xxsmall: 8,
      xsmall: 10,
      small: 14,
      medium: 16,
      large: 18,
      xlarge: 20,
      xxlarge: 24,
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
      backgroundColor: '#222',
      alignItems: 'center',
      justifyContent: 'center',
    },
    flexCentered: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    borderWithoutTop: {
      borderColor: '#222',
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderBottomWidth: 5,
    },
  },
}

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

export const NavOptions = {
  tabBarOptions: {
    style: {
      height: 45,
      backgroundColor: Styling.colors.black,
    },
    labelStyle: {
      fontSize: 8,
    },
    indicatorStyle: {
      backgroundColor: Styling.colors.primary,
      height: 3,
    },
    // tabStyle: { width: tabBarWidth - (notificationsBarWidth / tabBarItemCount) },
    pressColor: Styling.colors.primary,
    activeTintColor: Styling.colors.primary,
  },
  screenOptions: {
    headerStyle: {
      backgroundColor: Styling.colors.black,
    },
    headerTintColor: '#fff',
  },
  cardStyle: { backgroundColor: '#000' },
}
