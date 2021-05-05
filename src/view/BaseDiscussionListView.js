import React, { Component } from 'react'
import { Context, Storage } from '../lib'

export class BaseDiscussionListView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.navFocusListener = null
    this.navTabPressListener = null
  }

  componentDidMount() {
    this.config = this.context.config
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
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
  }

  async getList() {}

  async toggleRead(isShowingRead) {
    const config = await Storage.getConfig()
    config.isShowingReadOnLists = !isShowingRead
    this.setState({ isShowingRead: !isShowingRead })
    await Storage.setConfig(config)
    await this.getList()
  }

  showDiscussion(id) {
    this.props.onDetailShow(id)
  }
}
