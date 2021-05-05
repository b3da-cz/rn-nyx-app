import React, { Component } from 'react'
import { SectionList, Text, View } from 'react-native'
import { FAB } from 'react-native-paper'
import { DiscussionRowComponent } from '../component'
import { Context, Storage, Styling } from '../lib'

type Props = {
  navigation: any,
  onDetailShow: Function,
}
export class BookmarksView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      reminderCount: 0,
      sectionedBookmarks: [],
      isShowingRead: false,
      isFetching: false,
    }
    this.navFocusListener = null
    this.navTabPressListener = null
  }

  componentDidMount() {
    this.config = this.context.config
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      setTimeout(() => this.getBookmarks(), 100)
    })
    this.navTabPressListener = this.props.navigation.dangerouslyGetParent().addListener('tabPress', () => {
      const isFocused = this.props.navigation.isFocused()
      if (isFocused && !this.state.isFetching) {
        this.getBookmarks()
      }
    })
    setTimeout(() => {
      this.init()
      this.getBookmarks()
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

  async getBookmarks() {
    this.setState({ isFetching: true })
    const res = await this.nyx.getBookmarks(this.state.isShowingRead)
    if (res?.bookmarks?.length) {
      const reminderCount = res.reminder_count || 0
      const sectionedBookmarks = res.bookmarks.map(b => ({ title: b.category.category_name, data: b.bookmarks }))
      this.setState({ reminderCount, sectionedBookmarks, isFetching: false })
    } else {
      this.setState({ isFetching: false })
    }
  }

  async toggleRead(isShowingRead) {
    const config = await Storage.getConfig()
    config.isShowingReadOnLists = !isShowingRead
    this.setState({ isShowingRead: !isShowingRead })
    await Storage.setConfig(config)
    await this.getBookmarks()
  }

  showDiscussion(id) {
    this.props.onDetailShow(id)
  }

  render() {
    return (
      <View>
        <SectionList
          sections={this.state.sectionedBookmarks}
          stickySectionHeadersEnabled={true}
          initialNumToRender={100}
          keyExtractor={(item, index) => item.discussion_id}
          refreshing={this.state.isFetching}
          onRefresh={() => this.getBookmarks()}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              style={{
                fontSize: Styling.metrics.fontSize.medium,
                color: this.isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                backgroundColor: this.isDarkMode ? Styling.colors.dark : Styling.colors.lighter,
                textAlign: 'left',
                paddingVertical: 6,
                paddingHorizontal: Styling.metrics.block.small,
                marginBottom: Styling.metrics.block.xsmall,
              }}>
              {title}
            </Text>
          )}
          renderItem={({ item }) => (
            <DiscussionRowComponent
              key={item.discussion_id}
              discussion={item}
              isDarkMode={this.isDarkMode}
              onPress={id => this.showDiscussion(id)}
            />
          )}
        />
        <FAB
          small={true}
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            top: 0,
            backgroundColor: Styling.colors.darker,
            opacity: 0.75,
          }}
          icon={this.state.isShowingRead ? 'star' : 'star-outline'}
          visible={true}
          onPress={() => this.toggleRead(this.state.isShowingRead)}
        />
      </View>
    )
  }
}
