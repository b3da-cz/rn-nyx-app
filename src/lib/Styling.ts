export const Styling: any = {
  groups: {
    dialogMargin: { marginLeft: 5, marginRight: 5, marginTop: 5, zIndex: 1 },
    dialogPadding: { paddingLeft: 5, paddingRight: 5, paddingTop: 5, paddingBottom: 0 },
    highlight: {
      fontWeight: '700',
    },
    squareBtn: {
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    squareBtnBorder: {
      borderWidth: 1,
      marginBottom: 5,
      marginRight: 10,
    },
    flexCentered: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    flexRowCentered: { flexDirection: 'row', alignItems: 'center' },
    flexRowSpbCentered: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    shadow: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    fabDialogFilter: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
    fabDiscussionList: theme => ({
      position: 'absolute',
      margin: 16,
      right: 0,
      top: 0,
      backgroundColor: theme.colors.background,
      opacity: 0.75,
    }),
  },
}

export const NavOptions = {
  tabBarOptions: theme => ({
    tabBarStyle: {
      height: 45,
      backgroundColor: theme.colors.background,
    },
    tabBarLabelStyle: {
      fontSize: 8,
    },
    tabBarIndicatorStyle: {
      backgroundColor: theme.colors.primary,
      height: 3,
    },
    // tabBarItemStyle: { width: tabBarWidth - (notificationsBarWidth / tabBarItemCount) },
    tabBarPressColor: theme.colors.ripple,
    tabBarActiveTintColor: theme.colors.primary,
  }),
  screenOptions: (theme): any => ({
    headerStyle: {
      backgroundColor: theme.colors.background,
    },
    headerTitleStyle: { fontSize: theme.metrics.fontSizes.h3 },
    // headerTintColor: theme.colors.text,
  }),
  cardStyle: (theme): any => ({ backgroundColor: theme.colors.background }),
}

export const discussionScreenOptions = { headerShown: false, title: '' }

export const LayoutAnimConf: any = {
  spring: {
    duration: 300,
    create: {
      type: 'linear',
      property: 'opacity',
    },
    update: {
      type: 'spring',
      springDamping: 2,
    },
    delete: {
      type: 'spring',
      springDamping: 0.2,
      property: 'opacity',
    },
  },
  easeInEaseOut: {
    duration: 150,
    create: {
      type: 'easeInEaseOut',
      property: 'opacity',
    },
    update: {
      type: 'easeInEaseOut',
    },
  },
}
