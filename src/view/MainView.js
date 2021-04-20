import React, { Component } from 'react'
import { AppState, Alert, Animated, BackHandler, Text, TouchableOpacity, Modal, View } from 'react-native'
import ImageViewer from 'react-native-image-zoom-viewer'
import ImageView from "react-native-image-viewing";
import Icon from 'react-native-vector-icons/Feather'
import messaging from '@react-native-firebase/messaging'
import { Nyx, Styling, Storage } from '../lib'
import { ComposePostModal, DiscussionView, HistoryView, NotificationsView, MailView, LoginView } from '../view'

type Props = {
  isDarkMode: boolean,
}
export class MainView extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      isNyxInitialized: false,
      navStack: [{ view: 'history', args: {} }],
      activeView: 'history',
      title: 'History',
      activeDiscussionId: 0,
      activePostId: 0,
      isFetching: false,
      isModalImagesVisible: false,
      images: [],
      imgIndex: 0,
      uploadedFiles: [],
      notificationsUnread: 0,
      confirmationCode: null,
      animatedViewLeft_history: new Animated.Value(-Styling.metrics.screen().width),
      animatedViewLeft_bookmarks: new Animated.Value(-Styling.metrics.screen().width),
      animatedViewLeft_discussion: new Animated.Value(-Styling.metrics.screen().width),
      animatedViewLeft_notifications: new Animated.Value(-Styling.metrics.screen().width),
      animatedViewLeft_mail: new Animated.Value(-Styling.metrics.screen().width),
    }
    this.refComposePostModal = null
    this.refDiscussionView = null
    this.refMailView = null
    this.nyx = null
    this.initNyx()
    BackHandler.addEventListener('hardwareBackPress', () => {
      if (this.state.navStack.length > 1) {
        this.navigateBack()
        return true
      }
      return false // exit
    })
  }

  componentDidMount() {
    this.listenForFCM()
    // AppState.addEventListener('change', this.onAppStateChange)
  }

  componentWillUnmount() {
    // AppState.removeEventListener('change', this.onAppStateChange)
    if (this.backgroundNotificationListener) {
      this.backgroundNotificationListener();
    }
    if (this.closedAppNotificationListener) {
      // this.closedAppNotificationListener(); hmm is not unsub fn..
    }
    if (this.onMessageListener) {
      this.onMessageListener();
    }
  }

  async listenForFCM() {
    try {
      const processMessage = (message, isForegroundMsg = false) => {
        if (message && message.data) {
          console.warn(message, isForegroundMsg)
          // Alert.alert(message.notification.title, message.notification.body)
          switch (message.data.type) {
            case 'new_mail':
              if (this.state.activeView === 'mail' && this.refMailView) {
                this.refMailView.getMessages()
              } else {
                setTimeout(() => this.switchView('mail'), 100)
              }
              break
            // case 'new_mail':
            //   return setTimeout(() => this.switchView('mail'), 100)
          }
        }
      }
      this.backgroundNotificationListener = messaging().onNotificationOpenedApp(async (message) => {
        processMessage(message)
      })
      this.closedAppNotificationListener = messaging().getInitialNotification().then((message) => {
        processMessage(message)
      })
      this.onMessageListener = messaging().onMessage( message => {
        processMessage(message, true)
      })
    } catch (e) {
      console.warn(e)
    }
  }

  async initNyx(username?, isAuthProcess = false) {
    if (!username) {
      const auth = await Storage.getAuth()
      if (!auth || (auth && !auth.username)) {
        this.setState({ activeView: 'login' })
        Storage.removeAll()
        return
      }
      username = auth.username
    }
    this.nyx = new Nyx(username.toUpperCase())
    await this.nyx.init()
    this.setState({ isNyxInitialized: true })
    if (isAuthProcess) {
      this.setState({ confirmationCode: this.nyx.auth.confirmationCode })
    } else {
      setTimeout(() => this.slideIn('history'), 100)
      setTimeout(() => this.checkNotifications(), 700) // meh todo
    }
    this.initFCM()
  }

  async initFCM() {
    if (!this.nyx) {
      return
    }
    try {
      let config = await Storage.getConfig()
      if (!config || (config && !config.isFCMSubscribed)) {
        const fcmToken = await messaging().getToken()
        const subFCMRes = await this.nyx.subscribeForFCM(fcmToken)
        config = {
          fcmToken,
          isFCMSubscribed: !subFCMRes.error,
        }
        await Storage.setConfig(config)
      }
    } catch (e) {
      console.warn(e)
    }
  }

  slideReset(view) {
    Animated.timing(this.state[`animatedViewLeft_${view}`], {
      toValue: -Styling.metrics.screen().width,
      duration: 0,
      useNativeDriver: false,
    }).start()
  }

  slideIn(view) {
    Animated.spring(this.state[`animatedViewLeft_${view}`], {
      toValue: 0,
      friction: 6,
      useNativeDriver: false,
    }).start()
  }

  slideOut(view) {
    Animated.spring(this.state[`animatedViewLeft_${view}`], {
      toValue: Styling.metrics.screen().width,
      friction: 9,
      useNativeDriver: false,
    }).start()
  }

  switchView(view, args = {}, isBackNav: false) {
    const oldView = this.state.activeView
    if (view === oldView) {
      return
    }
    setTimeout(() => this.slideOut(oldView), 50)
    if (isBackNav) {
      setTimeout(() => this.setState({ activeView: view, ...args, title: this.getTitle(view) }), 200)
    } else {
      setTimeout(
        () =>
          this.setState({
            activeView: view,
            navStack: [...this.state.navStack, { view, args }],
            ...args,
            title: this.getTitle(view),
          }),
        200,
      )
    }
    setTimeout(() => this.slideIn(view), 210)
    setTimeout(() => this.slideReset(oldView), 300)
    setTimeout(() => {
      this.slideReset(oldView)
      this.checkNotifications()
    }, 300)
  }

  navigateBack() {
    if (this.state.activeView === 'login') {
      return
    }
    // console.warn(this.state.navStack) // TODO: remove
    if (this.state.navStack.length === 1) {
      // BackHandler.exitApp() // todo
      this.switchView('mail')
      // this.setState({activeView: 'login'})
    } else {
      this.state.navStack.splice(this.state.navStack.length - 1)
      const last = this.state.navStack[this.state.navStack.length - 1]
      this.switchView(last.view, last.args, true)
    }
  }

  getTitle(view) {
    switch (view) {
      case 'login':
        return 'Login'
      case 'history':
        return 'History'
      case 'bookmarks':
        return 'Bookmarks'
      case 'discussion':
        return 'Discussion'
      case 'notifications':
        return 'Notifications'
      case 'mail':
        return 'Mail'
    }
  }

  checkNotifications() {
    if (
      this.nyx.store &&
      this.nyx.store.context &&
      this.nyx.store.context.user &&
      this.nyx.store.context.user.notifications_unread !== this.state.notificationsUnread
    ) {
      this.setState({ notificationsUnread: this.nyx.store.context.user.notifications_unread })
    }
  }

  showImages(images, imgIndex) {
    this.setState({ images, imgIndex, isModalImagesVisible: true })
  }

  showComposePostModal() {
    this.refComposePostModal.showModal()
  }

  async onPostSend() {
    this.setState({ isFetching: true })
    if (this.refDiscussionView) {
      await this.refDiscussionView.reloadDiscussionLatest()
    }
    this.setState({ isFetching: false })
  }

  async showPost(discussionId, postId?) {
    this.switchView('discussion', { activeDiscussionId: discussionId, activePostId: postId || 0 })
    // if (this.refDiscussionView) {
    //   await this.refDiscussionView.jumpToPost(discussionId, postId)
    // }
  }

  render() {
    // todo refactor
    return (
      <Animated.View>
        {this.state.activeView === 'login' && (
          <View style={[Styling.groups.themeView(this.props.isDarkMode), { width: '100%', height: '100%' }]}>
            <LoginView
              isDarkMode={this.props.isDarkMode}
              confirmationCode={this.state.confirmationCode}
              onUsername={username => this.initNyx(username, true)}
              onLogin={() => this.setState({ activeView: 'history' })}
            />
          </View>
        )}
        {this.state.isNyxInitialized && (
          <View>
            <View
              style={[
                { height: 60, width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
                Styling.groups.themeComponent(this.props.isDarkMode),
              ]}>
              <TouchableOpacity
                style={{ alignItems: 'center', justifyContent: 'center' }}
                accessibilityRole="button"
                onPress={() => this.navigateBack()}>
                {this.state.navStack.length === 1 ? (
                  <Icon name="mail" size={24} color="#ccc" />
                ) : (
                  <Icon name="chevron-left" size={24} color="#ccc" />
                )}
              </TouchableOpacity>
              <Text
                style={{
                  color: Styling.colors.primary,
                  fontSize: 24,
                  lineHeight: 60,
                  maxWidth: Styling.metrics.window().width - 120,
                }}
                numberOfLines={1}>
                {this.state.title}
              </Text>
              {this.state.activeView === 'discussion' || this.state.activeView === 'mail' ? (
                <TouchableOpacity
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                  accessibilityRole="button"
                  onPress={() => this.showComposePostModal()}>
                  <Icon name="plus" size={24} color="#ccc" />
                  {/*<Text style={{color: Styling.colors.primary, fontSize: 24, lineHeight: 60, width: 60, paddingHorizontal: 5, textAlign: 'right'}}>+</Text>*/}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                  accessibilityRole="button"
                  onPress={() => this.switchView('notifications')}>
                  <View style={{ width: 60, lineHeight: 60 }}>
                    <Text style={{ color: 'red', fontSize: 24, lineHeight: 60, textAlign: 'right' }}>
                      {this.state.notificationsUnread}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            {this.state.activeView === 'history' && (
              <Animated.View
                style={[
                  Styling.groups.themeView(this.props.isDarkMode),
                  { width: '100%', height: '100%' },
                  { left: this.state.animatedViewLeft_history },
                ]}>
                <HistoryView
                  isDarkMode={this.props.isDarkMode}
                  nyx={this.nyx}
                  onDetailShow={id => this.switchView('discussion', { activeDiscussionId: id })}
                />
              </Animated.View>
            )}
            {/*todo*/}
            {this.state.activeView === 'bookmarks' && (
              <Animated.View
                style={[
                  Styling.groups.themeView(false),
                  { width: '100%', height: '100%' },
                  { left: this.state.animatedViewLeft_bookmarks },
                ]}>
                <HistoryView
                  isDarkMode={false}
                  nyx={this.nyx}
                  onDetailShow={id => this.switchView('discussion', { activeDiscussionId: id })}
                />
              </Animated.View>
            )}
            {this.state.activeView === 'notifications' && (
              <Animated.View
                style={[
                  Styling.groups.themeView(this.props.isDarkMode),
                  { width: '100%', height: '100%' },
                  { left: this.state.animatedViewLeft_notifications },
                ]}>
                <NotificationsView
                  isDarkMode={this.props.isDarkMode}
                  nyx={this.nyx}
                  onImages={(images, i) => this.showImages(images, i)}
                  onNavigation={({ discussionId, postId }) => this.showPost(discussionId, postId)}
                />
              </Animated.View>
            )}
            {this.state.activeView === 'mail' && (
              <Animated.View
                style={[
                  Styling.groups.themeView(this.props.isDarkMode),
                  { width: '100%', height: '100%' },
                  { left: this.state.animatedViewLeft_mail },
                ]}>
                <MailView
                  ref={r => (this.refMailView = r)}
                  isDarkMode={this.props.isDarkMode}
                  nyx={this.nyx}
                  onImages={(images, i) => this.showImages(images, i)}
                  onNavigation={({ discussionId, postId }) => this.showPost(discussionId, postId)}
                />
              </Animated.View>
            )}
            {this.state.activeView === 'discussion' && (
              <Animated.View
                style={[
                  Styling.groups.themeView(this.props.isDarkMode),
                  { width: '100%', height: '100%' },
                  { left: this.state.animatedViewLeft_discussion },
                ]}>
                <DiscussionView
                  ref={r => (this.refDiscussionView = r)}
                  isDarkMode={this.props.isDarkMode}
                  nyx={this.nyx}
                  id={this.state.activeDiscussionId}
                  postId={this.state.activePostId}
                  onDiscussionFetched={({ title, uploadedFiles }) => this.setState({ title, uploadedFiles })}
                  onImages={(images, i) => this.showImages(images, i)}
                />
              </Animated.View>
            )}
          </View>
        )}
        {this.state.images && this.state.images.length > 0 && (
          <ImageView
            images={this.state.images.map(i => ({ uri: i.url }))}
            imageIndex={this.state.imgIndex}
            visible={this.state.isModalImagesVisible}
            swipeToCloseEnabled={false}
            presentationStyle={'overFullScreen'}
            onRequestClose={() => this.setState({ isModalImagesVisible: false })}
          />
        )}
        {/*todo decide which image viewer*/}
        {/*<Modal*/}
        {/*  visible={this.state.isModalImagesVisible}*/}
        {/*  transparent={true}*/}
        {/*  animationType={'slide'}*/}
        {/*  onRequestClose={() => this.setState({ isModalImagesVisible: false })}>*/}
        {/*  <Icon name="x" size={24} color="#ccc" style={{position: 'absolute', top: 15, right: 15, zIndex: 1}} />*/}
        {/*  <ImageViewer imageUrls={this.state.images} index={this.state.imgIndex} />*/}
        {/*</Modal>*/}
        <ComposePostModal
          ref={r => (this.refComposePostModal = r)}
          isDarkMode={this.props.isDarkMode}
          nyx={this.nyx}
          title={this.state.title}
          uploadedFiles={this.state.uploadedFiles}
          activeDiscussionId={this.state.activeDiscussionId}
          onSend={() => this.onPostSend()}
        />
      </Animated.View>
    )
  }
}
