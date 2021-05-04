import React, { Component } from 'react'
import { SectionList, Text, View } from 'react-native'
import { PostComponent } from '../component'
import { Context, Styling, getDistinctPosts, parsePostsContent, t } from '../lib'

type Props = {
  navigation: any,
}
export class RemindersView extends Component<Props> {
  static contextType = Context
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
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    setTimeout(() => this.getReminders(), 100)
  }

  async getReminders() {
    this.setState({ isFetching: true })
    const bookmarks = await this.fetchReminders('bookmarks')
    const mail = await this.fetchReminders('mail')
    const sectionedReminders = [
      { title: t('reminders.inMail'), data: mail.reminders },
      { title: t('reminders.inDiscussions'), data: bookmarks.reminders },
    ]
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
    const parsedPosts = parsePostsContent(res.posts)
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
            <Text
              style={{
                fontSize: Styling.metrics.fontSize.medium,
                color: this.isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                backgroundColor: this.isDarkMode ? Styling.colors.dark : Styling.colors.lighter,
                textAlign: 'right',
                paddingVertical: 6,
                paddingHorizontal: Styling.metrics.block.small,
                marginBottom: Styling.metrics.block.xsmall,
              }}>
              {title}
            </Text>
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
