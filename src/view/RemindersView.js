import React, { Component } from 'react'
import { LayoutAnimation, SectionList, View } from 'react-native'
import { PostComponent, SectionHeaderComponent } from '../component'
import { MainContext, Styling, parsePostsContent, t, filterDiscussions, filterPostsByContent } from '../lib'

type Props = {
  navigation: any,
}
export class RemindersView extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.state = {
      sectionedReminders: [],
      bookmarks: [],
      mail: [],
      images: [],
      isFetching: false,
    }
    this.refScroll = null
    this.navFocusListener = null
    this.navTabPressListener = null
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.filters = [...this.context.filters, ...this.context.blockedUsers]
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      setTimeout(() => this.getReminders(), 100)
    })
    this.navTabPressListener = this.props.navigation.dangerouslyGetParent().addListener('tabPress', () => {
      const isFocused = this.props.navigation.isFocused()
      if (isFocused && !this.state.isFetching) {
        this.getReminders()
      }
    })
    setTimeout(() => this.getReminders(), 100)
  }

  componentWillUnmount() {
    if (this.navFocusListener) {
      this.navFocusListener()
    }
    if (this.navTabPressListener) {
      this.navTabPressListener()
    }
  }

  async getReminders() {
    this.setState({ isFetching: true })
    const bookmarks = await this.fetchReminders('bookmarks')
    const mail = await this.fetchReminders('mail')
    const sectionedReminders = [
      { title: t('reminders.inMail'), data: mail.reminders },
      { title: t('reminders.inDiscussions'), data: bookmarks.reminders },
    ]
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear)
    this.setState({
      images: [...mail.images, ...bookmarks.images],
      bookmarks: bookmarks.reminders,
      mail: mail.reminders,
      sectionedReminders,
      isFetching: false,
    })
  }

  async fetchReminders(type) {
    const res = await this.nyx.getReminders(type)
    // const newPosts = getDistinctPosts(res.posts, this.state[type])
    const filteredPosts = filterPostsByContent(filterDiscussions(res.posts, this.filters), this.filters)
    const parsedPosts = parsePostsContent(filteredPosts)
    const images = parsedPosts.flatMap(p => p.parsed.images)
    return {
      reminders: parsedPosts,
      images,
    }
  }

  showPost(discussionId, postId) {
    this.props.navigation.push('discussion', { discussionId, postId })
  }

  showImages(image) {
    const imgIndex = this.state.images.indexOf(image)
    const images = this.state.images.map(img => ({ url: img.src }))
    this.props.navigation.navigate('gallery', { images, imgIndex })
  }

  onReminderRemove(post) {
    let { bookmarks, mail } = this.state
    bookmarks = bookmarks.filter(p => p.id !== post.id)
    mail = mail.filter(p => p.id !== post.id)
    this.setState({
      bookmarks,
      mail,
      sectionedReminders: [
        { title: t('reminders.inMail'), data: mail },
        { title: t('reminders.inDiscussions'), data: bookmarks },
      ],
    })
  }

  render() {
    return (
      <View style={{ backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.white }}>
        <SectionList
          sections={this.state.sectionedReminders}
          stickySectionHeadersEnabled={true}
          initialNumToRender={20}
          keyExtractor={(item, index) => item.id}
          refreshing={this.state.isFetching}
          onRefresh={() => this.getReminders()}
          renderSectionHeader={({ section: { title } }) => (
            <SectionHeaderComponent isDarkMode={this.isDarkMode} title={title} />
          )}
          renderItem={({ item }) => (
            <PostComponent
              key={item.id}
              post={item}
              nyx={this.nyx}
              isDarkMode={this.isDarkMode}
              isHeaderInteractive={false}
              isReply={false}
              isUnread={item.new}
              isHeaderPressable={item.discussion_id > 0}
              onHeaderPress={() => (item.discussion_id > 0 ? this.showPost(item.discussion_id, item.id) : null)}
              onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
              onImage={image => this.showImages(image)}
              onReminder={post => this.onReminderRemove(post)}
            />
          )}
        />
      </View>
    )
  }
}
