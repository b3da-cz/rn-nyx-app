import React, { Component } from 'react'
import { ActivityIndicator, Alert, Animated, BackHandler, Text, TextInput, TouchableOpacity, Modal, View } from 'react-native';
import DocumentPicker from 'react-native-document-picker'
import ImageViewer from 'react-native-image-zoom-viewer'
import Icon from 'react-native-vector-icons/Feather'
import messaging from '@react-native-firebase/messaging'
import { confirm, DiscussionView, HistoryView, Nyx, Styling, Storage } from './'

type Props = {
  isDarkMode: boolean,
};
export class MainView extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      navStack: [{ view: 'history', args: {} }],
      activeView: 'history',
      title: 'History',
      activeDiscussionId: 0,
      isFetching: false,
      isModalImagesVisible: false,
      images: [],
      imgIndex: 0,
      isModalPostVisible: false,
      modalPostData: { text: '', files: [] },
      notificationsUnread: 0,
      animatedViewLeft_history: new Animated.Value(-Styling.metrics.screen.width),
      animatedViewLeft_bookmarks: new Animated.Value(-Styling.metrics.screen.width),
      animatedViewLeft_discussion: new Animated.Value(-Styling.metrics.screen.width),
    }
    this.refDiscussionView = null
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
    this.initFCM()
  }

  async initNyx() {
    // console.warn(`init nyx`); // TODO: remove
    this.nyx = new Nyx('B3DA')
    // this.nyx.setVisibility(false)
    // console.warn(nyx); // TODO: remove
    // const animDelay = 1200
    // let timeout = 100
    // for (let i; i < 10; i++) {
    //   console.warn(timeout + (i * animDelay)); // TODO: remove
    //   setTimeout(() => this.slideIn(), timeout + (i * animDelay))
    //
    // }
    // setTimeout(() => this.slideReset(), 100)
    setTimeout(() => this.slideIn('history'), 100)
    setTimeout(() => this.checkNotifications(), 700)
    // setTimeout(() => this.slideReset(), 1100)
    // setTimeout(() => this.slideIn(), 1200)

    // setTimeout(() => this.switchView('bookmarks'), 5000)
    // setTimeout(() => this.switchView('history'), 10000)
    // setTimeout(() => this.switchView('bookmarks'), 15000)
    // setTimeout(() => this.slideReset(), 6000)
    // setTimeout(() => this.slideIn(), 7000)
    // setTimeout(() => this.slideOut(), 8000)
  }

  async initFCM() {
    // FCM foreground {"notification":{"android":{},"body":"Budes to portovat na iOS? Docela by me zajimala performance Flutter vs. React Native.","title":"LUCIEN"},"sentTime":1618761935185,"data":{"type":"new_mail"},"from":"68046947866","messageId":"0:1618761935204425%6045de3f6045de3f","ttl":2419200,"collapseKey":"net.b3da.nnn"}
    try {
      let config = await Storage.getConfig()
      if (!config) {
        const fcmToken = await messaging().getToken()
        const subFCMRes = await this.nyx.subscribeForFCM(fcmToken)
        config = {
          fcmToken,
          isFCMSubscribed: !subFCMRes.error,
        }
        await Storage.setConfig(config)
      }
      await messaging().getInitialNotification()
      const unsubscribeFromFCM = messaging().onMessage(async remoteMessage => {
        console.warn('FCM foreground', JSON.stringify(remoteMessage)); // todo
        if (remoteMessage.data && remoteMessage.data.type === 'new_mail') {
          Alert.alert(remoteMessage.notification.title, remoteMessage.notification.body)
        }
      });
    } catch (e) { console.warn(e) }
  }

  slideReset(view) {
    Animated.timing(this.state[`animatedViewLeft_${view}`], {
      toValue: -Styling.metrics.screen.width,
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
      toValue: Styling.metrics.screen.width,
      friction: 9,
      useNativeDriver: false,
    }).start()
  }

  switchView(view, args = {}, isBackNav: false) {
    const oldView = this.state.activeView
    setTimeout(() => this.slideOut(oldView), 50)
    if (isBackNav) {
      setTimeout(() => this.setState({ activeView: view, ...args, title: this.getTitle(view) }), 200);
    } else {
      setTimeout(() => this.setState({ activeView: view, navStack: [...this.state.navStack, {view, args}], ...args, title: this.getTitle(view) }), 200);
    }
    setTimeout(() => this.slideIn(view), 210)
    setTimeout(() => this.slideReset(oldView), 300)
    this.checkNotifications()
  }

  navigateBack() {
    // console.warn(this.state.navStack); // TODO: remove
    if (this.state.navStack.length === 1) {
      BackHandler.exitApp()
    } else {
      this.state.navStack.splice(this.state.navStack.length - 1)
      const last = this.state.navStack[this.state.navStack.length - 1]
      this.switchView(last.view, last.args, true)
    }
  }

  getTitle(view) {
    switch (view) {
      case 'history':
        return 'History'
      case 'bookmarks':
        return 'Bookmarks'
      case 'discussion':
        return 'Discussion'
    }
  }

  checkNotifications() {
    if (this.nyx.store && this.nyx.store.context && this.nyx.store.context.user && this.nyx.store.context.user.notifications_unread !== this.state.notificationsUnread) {
      this.setState({ notificationsUnread: this.nyx.store.context.user.notifications_unread })
    }
  }

  showImages(images, imgIndex) {
    this.setState({ images, imgIndex, isModalImagesVisible: true })
  }

  showModalPost() {
    this.setState({ isModalPostVisible: true })
  }

  async pickFile() {
    try {
      const file = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
      });
      // console.log(
      //   file.uri,
      //   file.type, // mime type
      //   file.name,
      //   file.size
      // );
      this.setState({ isFetching: true })
      const res = await this.nyx.uploadFile(this.state.activeDiscussionId, {uri: file.uri, type: file.type, name: file.name})
      // console.warn(res); // TODO: remove
      if (res && res.id > 0) {
        this.setState({isFetching: false, modalPostData: {...this.state.modalPostData, files: [...this.state.modalPostData.files, res]}})
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err;
      }
    }
  }

  async deleteFile(fileId) {
    Alert.alert('Warning', 'Delete attachment?', [
      {
        text: 'Cancel',
        onPress: () => null,
        style: 'cancel',
      },
      { text: 'OK', onPress: async () => {

          this.setState({ isFetching: true })
          await this.nyx.deleteFile(fileId)
          this.setState({isFetching: false, modalPostData: {...this.state.modalPostData, files: this.state.modalPostData.files.filter(f => f.id !== fileId)}})
        }},
    ])
  }

  async post() {
    if (!this.state.modalPostData.text || (this.state.modalPostData.text && this.state.modalPostData.text.length < 3)) {
      return
    }
    this.setState({ isFetching: true });
    // console.warn(this.state.modalPostData); // TODO: remove
    const res = await this.nyx.postToDiscussion(this.state.activeDiscussionId, this.state.modalPostData.text)
    if (res.error) {
      console.warn(res)
    }
    if (this.refDiscussionView) {
      await this.refDiscussionView.reloadDiscussionLatest()
    }
    this.setState({ isFetching: false, isModalPostVisible: false })
  }

  render() {
    return (
      <Animated.View>
        {this.nyx &&
          <View>
            <View style={[{height: 60, width: '100%', flexDirection: 'row', justifyContent: 'space-between'}, Styling.groups.themeComponent(this.props.isDarkMode)]}>
              <TouchableOpacity
                style={{ alignItems: 'center', justifyContent: 'center' }}
                accessibilityRole="button"
                onPress={() => this.navigateBack()}>
                {this.state.navStack.length === 1 ? <Icon name="x" size={24} color="#ccc" /> : <Icon name="chevron-left" size={24} color="#ccc" />}
                {/*<Text style={{color: Styling.colors.primary, fontSize: 24, lineHeight: 60, width: 60, paddingHorizontal: 5}}>{this.state.navStack.length === 1 ? `x` : `<`}</Text>*/}
              </TouchableOpacity>
              <Text style={{color: Styling.colors.primary, fontSize: 24, lineHeight: 60, maxWidth: Styling.metrics.window.width - 120}} numberOfLines={1}>{this.state.title}</Text>
              {this.state.activeView === 'discussion' ?
                <TouchableOpacity
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                  accessibilityRole="button"
                  onPress={() => this.showModalPost()}>
                  <Icon name="plus" size={24} color="#ccc" />
                  {/*<Text style={{color: Styling.colors.primary, fontSize: 24, lineHeight: 60, width: 60, paddingHorizontal: 5, textAlign: 'right'}}>+</Text>*/}
                </TouchableOpacity>
                :
                <View style={{ width: 60, lineHeight: 60 }}>
                  <Text style={{ color: 'red', fontSize: 24, lineHeight: 60, textAlign: 'right' }}>{this.state.notificationsUnread > 0 ? this.state.notificationsUnread : ''}</Text>
                </View>
              }
            </View>
            {/*<Animated.View style={{ top: 0, bottom: 0, left: this.state.animatedViewLeft_history }}><HistoryView isDarkMode={this.props.isDarkMode} nyx={this.nyx} /></Animated.View>*/}
            {/*<Animated.View style={{ top: 0, bottom: 0, left: this.state.animatedViewLeft_bookmarks }}><HistoryView isDarkMode={false} nyx={this.nyx} /></Animated.View>*/}
            {this.state.activeView === 'history' && <Animated.View style={[Styling.groups.themeView(this.props.isDarkMode),{width: '100%', height: '100%'},{ left: this.state.animatedViewLeft_history }]}><HistoryView isDarkMode={this.props.isDarkMode} nyx={this.nyx} onDetailShow={id => this.switchView('discussion', {activeDiscussionId: id})} /></Animated.View>}
            {this.state.activeView === 'bookmarks' && <Animated.View style={[Styling.groups.themeView(false),{width: '100%', height: '100%'},{ left: this.state.animatedViewLeft_bookmarks }]}><HistoryView isDarkMode={false} nyx={this.nyx} onDetailShow={id => this.switchView('discussion', {activeDiscussionId: id})} /></Animated.View>}
            {this.state.activeView === 'discussion' && <Animated.View style={[Styling.groups.themeView(this.props.isDarkMode),{width: '100%', height: '100%'},{ left: this.state.animatedViewLeft_discussion }]}><DiscussionView ref={r => this.refDiscussionView = r} isDarkMode={this.props.isDarkMode} nyx={this.nyx} id={this.state.activeDiscussionId} onDiscussionFetched={({title, uploadedFiles}) => this.setState({title, modalPostData: {...this.state.modalPostData, files: uploadedFiles}})} onImages={(images, i) => this.showImages(images, i)}/></Animated.View>}
          </View>}
        {this.state.images && this.state.images.length > 0 &&
          <Modal
            visible={this.state.isModalImagesVisible}
            transparent={true}
            animationType={'slide'}
            onRequestClose={() => this.setState({ isModalImagesVisible: false })}>
            <ImageViewer imageUrls={this.state.images} index={this.state.imgIndex} />
          </Modal>
        }
        <Modal
          visible={this.state.isModalPostVisible}
          transparent={false}
          animationType={'slide'}
          onRequestClose={() => this.setState({ isModalPostVisible: false })}>
          <View style={[Styling.groups.themeView(this.props.isDarkMode), { width: '100%', height: '100%' }]}>
            {/*<Text style={[Styling.groups.themeComponent(this.props.isDarkMode), { width: '100%' }]}>activeDiscussionId: {this.state.activeDiscussionId}</Text>*/}
            <Text style={[Styling.groups.themeComponent(this.props.isDarkMode), { width: '100%', fontSize: 24, lineHeight: 60 }]}>Post to {this.state.title}</Text>
            <View style={{flex: 1}}>
              <TextInput
                multiline={true}
                numberOfLines={15}
                textAlignVertical={'top'}
                onChangeText={val => this.setState({modalPostData: {...this.state.modalPostData, text: val}})}
                value={`${this.state.modalPostData.text}`}
                placeholder={'message ...'}
                // style={{ borderColor: Styling.colors.dark, borderBottomWidth: 1 }}
                style={{ backgroundColor: Styling.colors.dark }}
              />
            </View>
            <View>
              {this.state.isFetching && <ActivityIndicator size="large" color={Styling.colors.primary} style={{ marginBottom: 200 }} />}
              {this.state.modalPostData.files && this.state.modalPostData.files.length > 0 && this.state.modalPostData.files.map(f => (
                <TouchableOpacity
                  style={[Styling.groups.themeComponent(this.props.isDarkMode), { width: '100%', fontSize: 24, lineHeight: 60 }]}
                  accessibilityRole="button"
                  onPress={() => this.deleteFile(f.id)}>
                  <Text style={{color: Styling.colors.dark, fontSize: 16, lineHeight: 60, paddingHorizontal: 5}}>
                    <Icon name="trash-2" size={24} color="#ccc" />
                    {` ${f.filename}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[Styling.groups.themeComponent(this.props.isDarkMode), { width: '100%', fontSize: 24, lineHeight: 60 }]}
              accessibilityRole="button"
              onPress={() => this.pickFile()}>
              <Text style={{color: Styling.colors.primary, fontSize: 24, lineHeight: 60, paddingHorizontal: 5, textAlign: 'center'}}>
                <Icon name="image" size={24} color="#ccc" />
                {` Append file ${this.state.modalPostData.files && this.state.modalPostData.files.length > 0 ? `[${this.state.modalPostData.files.length}]` : ''}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[Styling.groups.themeComponent(this.props.isDarkMode), { width: '100%', fontSize: 24, lineHeight: 60 }]}
              accessibilityRole="button"
              onPress={() => this.post()}>
              <Text style={{color: Styling.colors.primary, fontSize: 24, lineHeight: 60, paddingHorizontal: 5, textAlign: 'center'}}>
                <Icon name="send" size={24} color="#ccc" />
                {` Send`}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
        {/*<View>*/}
        {/*  <Text>*/}
        {/*    Foo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar baz*/}
        {/*    Foo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar baz*/}
        {/*    Foo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar bazFoo bar baz*/}
        {/*    Foo bar baz*/}
        {/*  </Text>*/}
        {/*</View>*/}
        {/*<View>*/}
        {/*  <TouchableOpacity*/}
        {/*    accessibilityRole="button"*/}
        {/*    onPress={() => this.initNyx()}*/}
        {/*    style={styles.linkContainer}>*/}
        {/*    <Text style={styles.link}>init nyx api</Text>*/}
        {/*    <Text*/}
        {/*      style={[*/}
        {/*        styles.description,*/}
        {/*        {*/}
        {/*          color: this.props.isDarkMode ? Colors.lighter : Colors.dark,*/}
        {/*        },*/}
        {/*      ]}>*/}
        {/*      {`description`}*/}
        {/*    </Text>*/}
        {/*  </TouchableOpacity>*/}
        {/*</View>*/}
      </Animated.View>
    )
  }
}
