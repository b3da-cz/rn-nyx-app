import { Dimensions } from 'react-native'

export const Styling = {
  colors: {
    primary: '#1292B4',
    secondary: '#b46612',
    accent: '#c40000',
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
      xsmall: 2,
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
      backgroundColor: 'red',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 5,
    },
    flexCentered: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
}

export const NavOptions = {
  tabBarOptions: {
    style: {
      height: 50,
      backgroundColor: Styling.colors.black,
    },
    labelStyle: {
      fontSize: 11,
    },
    indicatorStyle: {
      backgroundColor: Styling.colors.primary,
      height: 3,
    },
    pressColor: Styling.colors.primary,
    activeTintColor: Styling.colors.primary,
  },
  screenOptions: {
    headerStyle: {
      backgroundColor: Styling.colors.black,
    },
    headerTintColor: '#fff',
  },
}
