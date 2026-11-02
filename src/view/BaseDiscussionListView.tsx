import React, { Component } from 'react'
import { InteractionManager } from 'react-native'
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
  listRequest = 0
  isUnmounted = false
  pendingDiscussionReturn = false
  constructor(props) {
    super(props)
  }

  lastFetchAt = 0

  hasData(): boolean {
    return false
  }

  componentDidMount() {
    this.isUnmounted = false
    this.config = this.context.config
    this.nyx = this.context.nyx
    this.filters = [...this.context.filters, ...this.context.blockedUsers]
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      const lastDiscussionViewedAt = this.context?.refs?.lastDiscussionViewedAt || 0
      const returnedFromDiscussion =
        this.pendingDiscussionReturn || (lastDiscussionViewedAt > 0 && lastDiscussionViewedAt > this.lastFetchAt)
      this.pendingDiscussionReturn = false
      if (returnedFromDiscussion) {
        this.getList(false, true)
      } else {
        this.scheduleList()
      }
    })
    this.navTabPressListener = this.props.navigation.getParent()?.addListener('tabPress', () => {
      const isFocused = typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
      if (isFocused && !this.state.isFetching) {
        this.getList(false, true)
      }
    })
    this.init()
    this.scheduleList()
  }

  scheduleList(force = false) {
    const request = ++this.listRequest
    InteractionManager.runAfterInteractions(() => {
      if (this.isUnmounted || request !== this.listRequest) {
        return
      }
      const isFocused = typeof this.props.navigation?.isFocused === 'function' ? this.props.navigation.isFocused() : true
      if (!isFocused) {
        return
      }
      const now = Date.now()
      if (!force && this.lastFetchAt > 0 && now - this.lastFetchAt < 60000 && this.hasData()) {
        return
      }
      this.getList(false, force)
    })
  }

  componentWillUnmount() {
    this.isUnmounted = true
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

  async getList(isAnimated = false, force = false) {}

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
    this.pendingDiscussionReturn = true
    if (this.context?.refs) {
      this.context.refs.lastDiscussionViewedAt = Date.now()
    }
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
