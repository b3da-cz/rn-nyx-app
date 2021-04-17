import React, { Component } from 'react'
import { Animated, BackHandler, Text, TouchableOpacity, Modal, View } from 'react-native'
import ImageViewer from 'react-native-image-zoom-viewer'
import { DiscussionView, HistoryView, Nyx, Styling } from './'

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
      images: [],
      imgIndex: 0,
      animatedViewLeft_history: new Animated.Value(-Styling.metrics.screen.width),
      animatedViewLeft_bookmarks: new Animated.Value(-Styling.metrics.screen.width),
      animatedViewLeft_discussion: new Animated.Value(-Styling.metrics.screen.width),
    }
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

  async initNyx() {
    // console.warn(`init nyx`); // TODO: remove
    this.nyx = new Nyx('B3DA')
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
    // setTimeout(() => this.slideOut(), 1300)
    // setTimeout(() => this.slideReset(), 1100)
    // setTimeout(() => this.slideIn(), 1200)

    // setTimeout(() => this.switchView('bookmarks'), 5000)
    // setTimeout(() => this.switchView('history'), 10000)
    // setTimeout(() => this.switchView('bookmarks'), 15000)
    // setTimeout(() => this.slideReset(), 6000)
    // setTimeout(() => this.slideIn(), 7000)
    // setTimeout(() => this.slideOut(), 8000)

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

  showImages(images, imgIndex) {
    this.setState({ images, imgIndex, isModalVisible: true })
  }

  render() {
    return (
      <Animated.View>
        {this.nyx &&
          <View>
            <View style={[{height: 60, width: '100%', flexDirection: 'row', justifyContent: 'space-between'}, Styling.groups.themeComponent(this.props.isDarkMode)]}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => this.navigateBack()}>
                <Text style={{color: Styling.colors.primary, fontSize: 24, lineHeight: 60, width: 80, paddingHorizontal: 5}}>{this.state.navStack.length === 1 ? `x` : `<`}</Text>
              </TouchableOpacity>
              <Text style={{color: Styling.colors.primary, fontSize: 24, lineHeight: 60, paddingRight: 5}}>{this.state.title}</Text>
            </View>
            {/*<Animated.View style={{ top: 0, bottom: 0, left: this.state.animatedViewLeft_history }}><HistoryView isDarkMode={this.props.isDarkMode} nyx={this.nyx} /></Animated.View>*/}
            {/*<Animated.View style={{ top: 0, bottom: 0, left: this.state.animatedViewLeft_bookmarks }}><HistoryView isDarkMode={false} nyx={this.nyx} /></Animated.View>*/}
            {this.state.activeView === 'history' && <Animated.View style={[Styling.groups.themeView(this.props.isDarkMode),{width: '100%', height: '100%'},{ left: this.state.animatedViewLeft_history }]}><HistoryView isDarkMode={this.props.isDarkMode} nyx={this.nyx} onDetailShow={id => this.switchView('discussion', {activeDiscussionId: id})} /></Animated.View>}
            {this.state.activeView === 'bookmarks' && <Animated.View style={[Styling.groups.themeView(false),{width: '100%', height: '100%'},{ left: this.state.animatedViewLeft_bookmarks }]}><HistoryView isDarkMode={false} nyx={this.nyx} onDetailShow={id => this.switchView('discussion', {activeDiscussionId: id})} /></Animated.View>}
            {this.state.activeView === 'discussion' && <Animated.View style={[Styling.groups.themeView(this.props.isDarkMode),{width: '100%', height: '100%'},{ left: this.state.animatedViewLeft_discussion }]}><DiscussionView isDarkMode={this.props.isDarkMode} nyx={this.nyx} id={this.state.activeDiscussionId} onDiscussionFetched={({title}) => this.setState({title})} onImages={(images, i) => this.showImages(images, i)}/></Animated.View>}
          </View>}
        {this.state.images && this.state.images.length > 0 &&
          <Modal
            visible={this.state.isModalVisible}
            transparent={true}
            animationType={'slide'}
            onRequestClose={() => this.setState({ isModalVisible: false })}>
            <ImageViewer imageUrls={this.state.images} index={this.state.imgIndex} />
          </Modal>
        }
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
