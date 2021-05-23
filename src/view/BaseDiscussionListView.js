import React, { Component } from 'react'
import { FAB } from 'react-native-paper'
import { MainContext, Storage, Styling } from '../lib'

type Props = {
  navigation: any,
}
export class BaseDiscussionListView extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.navFocusListener = null
    this.navTabPressListener = null
  }

  componentDidMount() {
    this.config = this.context.config
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.filters = [...this.context.filters, ...this.context.blockedUsers]
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      setTimeout(() => this.getList(), 100)
    })
    this.navTabPressListener = this.props.navigation.dangerouslyGetParent().addListener('tabPress', () => {
      const isFocused = this.props.navigation.isFocused()
      if (isFocused && !this.state.isFetching) {
        this.getList()
      }
    })
    setTimeout(() => {
      this.init()
      this.getList()
    }, 100)
  }

  componentWillUnmount() {
    if (this.navFocusListener) {
      this.navFocusListener()
    }
    if (this.navTabPressListener) {
      this.navTabPressListener()
    }
  }

  init() {
    this.setState({ isShowingRead: this.config?.isShowingReadOnLists })
    this.setState({ shownCategories: this.config?.shownCategories })
  }

  async getList() {}

  async toggleRead(isShowingRead) {
    const config = await Storage.getConfig()
    config.isShowingReadOnLists = !isShowingRead
    this.setState({ isShowingRead: !isShowingRead })
    await Storage.setConfig(config)
    await this.getList()
  }

  async persistShownCategories(shownCategories) {
    const config = await Storage.getConfig()
    config.shownCategories = shownCategories
    await Storage.setConfig(config)
  }

  showDiscussion(discussionId) {
    this.props.navigation.push('discussion', { discussionId, jumpToLastSeen: true })
  }

  showDiscussionStats(discussionId) {
    // this.props.navigation.push('discussion', { discussionId, showStats: true })
  }

  renderFAB() {
    return (
      <FAB
        small={true}
        style={Styling.groups.fabDiscussionList(this.isDarkMode)}
        color={
          !this.state.isShowingRead
            ? Styling.colors.primary
            : this.isDarkMode
            ? Styling.colors.lighter
            : Styling.colors.darker
        }
        icon={this.state.isShowingRead ? 'star-outline' : 'star'}
        visible={true}
        onPress={() => this.toggleRead(this.state.isShowingRead)}
      />
    )
  }
}
