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
    flexCentered: {
      alignItems: 'center',
      justifyContent: 'center',
    },
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
    style: {
      height: 45,
      backgroundColor: theme.colors.background,
    },
    labelStyle: {
      fontSize: 8,
    },
    indicatorStyle: {
      backgroundColor: theme.colors.primary,
      height: 3,
    },
    // tabStyle: { width: tabBarWidth - (notificationsBarWidth / tabBarItemCount) },
    pressColor: theme.colors.ripple,
    activeTintColor: theme.colors.primary,
  }),
  screenOptions: (theme): any => ({
    headerStyle: {
      backgroundColor: theme.colors.background,
      height: 50,
    },
    headerTitleStyle: { fontSize: theme.metrics.fontSizes.h3 },
    // headerTintColor: theme.colors.text,
  }),
  cardStyle: (theme): any => ({ backgroundColor: theme.colors.background }),
}

export const discussionScreenOptions = { headerShown: false, title: '', headerTopInsetEnabled: false }

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
