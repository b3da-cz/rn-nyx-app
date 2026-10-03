import React, { Component } from 'react'
import { FAB } from 'react-native-paper'
import { MainContext, Nyx, Storage, Styling } from '../lib'

type Props = {
  navigation: any
}
export class BaseDiscussionListView<P> extends Component<Props> {
  static contextType = MainContext
  state: Readonly<any> = {}
  config: any
  nyx?: Nyx
  filters: string[] = []
  navFocusListener?: Function
  navTabPressListener?: Function
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.config = this.context.config
    this.nyx = this.context.nyx
    this.filters = [...this.context.filters, ...this.context.blockedUsers]
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      setTimeout(() => this.getList(), 100)
    })
    this.navTabPressListener = this.props.navigation.getParent()?.addListener('tabPress', () => {
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
    this.setState({
      isShowingRead: this.config?.isShowingReadOnLists,
      isUnreadToggleEnabled: this.config?.isUnreadToggleEnabled,
      shownCategories: this.config?.shownCategories,
      theme: this.context.theme,
    })
  }

  async getList() {}

  async toggleRead(isShowingRead) {
    const next = !isShowingRead
    if (this.context?.config) {
      this.context.config.isShowingReadOnLists = next
    }
    const config = await Storage.getConfig()
    config.isShowingReadOnLists = next
    this.setState({ isShowingRead: next })
    await Storage.setConfig(config)
    await this.getList()
  }

  async persistShownCategories(shownCategories) {
    if (this.context?.config) {
      this.context.config.shownCategories = shownCategories
    }
    const config = await Storage.getConfig()
    config.shownCategories = shownCategories
    await Storage.setConfig(config)
  }

  showDiscussion(discussionId, lastSeenPostId?) {
    this.props.navigation.push('discussion', { discussionId, jumpToLastSeen: true, lastSeenPostId })
  }

  showDiscussionStats(discussionId) {
    console.log(discussionId)
    // this.props.navigation.push('discussion', { discussionId, showStats: true })
  }

  renderFAB() {
    if (!this.state.isUnreadToggleEnabled) {
      return null
    }
    const { theme } = this.state
    if (!theme) {
      return null
    }
    return (
      <FAB
        small={true}
        style={Styling.groups.fabDiscussionList(theme)}
        color={!this.state.isShowingRead ? theme.colors.accent : theme.colors.text}
        icon={this.state.isShowingRead ? 'star-outline' : 'star'}
        visible={true}
        onPress={() => this.toggleRead(this.state.isShowingRead)}
      />
    )
  }
}
