import React from 'react'
import { generateUuidV4, Parser, rgbToHex, showNotificationBanner, useTheme } from '../lib'
import { SectionHeaderComponent } from './SectionHeaderComponent'
import { PostComponent } from './PostComponent'
import { View } from 'react-native'
import { DiscussionRowComponent } from './DiscussionRowComponent'
import { RNNotificationBanner } from 'react-native-notification-banner'

type Post = {
  id: string | number
  username: string
  discussion_name?: string
  inserted_at?: string
  content: string
  parsed?: any
}
type TopicProps = {
  id: number
  discussion_id: string | number
  full_name: string
  discussion_name: string
  new_posts_count: number
  new_images_count: number
  new_replies_count: number
  new_links_count: number
}
class Topic {
  id: number
  discussion_id: string | number
  full_name: string
  discussion_name: string
  unreadPostCount: number
  new_images_count: number
  new_replies_count: number
  new_links_count: number
  parsed: any
  constructor({
    id,
    discussion_id,
    full_name,
    discussion_name,
    new_posts_count,
    new_images_count,
    new_replies_count,
    new_links_count,
  }: Partial<TopicProps>) {
    this.id = id ?? 0
    this.discussion_id = discussion_id ?? 0
    this.full_name = full_name || ''
    this.discussion_name = discussion_name ?? ''
    this.unreadPostCount = Math.max(
      new_posts_count || 0,
      new_replies_count || 0,
      new_images_count || 0,
      new_links_count || 0,
    )
    this.new_replies_count = new_replies_count ?? 0
    this.new_links_count = new_links_count ?? 0
    this.new_images_count = new_images_count ?? 0
  }
}

export const ComponentExamplesComponent = ({ nyx }) => {
  const { colors } = useTheme()
  const previewNotification = isMail =>
    showNotificationBanner({
      title: isMail ? 'Mail preview' : 'Reply preview',
      body: 'Hello World',
      tintColor: rgbToHex(isMail ? colors.secondary : colors.primary),
      textColor: rgbToHex(colors.text),
      icon: isMail ? 'mail' : 'corner-down-right',
      onClick: async () => {
        RNNotificationBanner.Dismiss()
      },
    })
  const exampleDiscussions = new Array(5).fill(null).map(
    (t, i) =>
      new Topic({
        discussion_id: generateUuidV4(),
        full_name: `Example Topic ${i}`,
        new_posts_count: Math.floor(Math.random() * 10 * (i - 1)),
        new_replies_count: Math.floor(Math.random() * (i - 1)),
        new_images_count: Math.floor(Math.random() * (i - 1)),
        new_links_count: Math.floor(Math.random() * (i - 1)),
      }),
  )
  const examplePostUnread: Post = {
    id: 'exampleUnread',
    username: 'B3DA',
    discussion_name: 'nnn',
    inserted_at: '2020-06-01T00:00:00',
    content:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. <div class="spoiler">Maecenas libero. Mauris metus. Vestibulum fermentum tortor id mi. Etiam commodo dui eget wisi. Maecenas ipsum velit, consectetuer eu lobortis ut, dictum at dui. In convallis. Fusce aliquam vestibulum ipsum.</div> Integer tempor. Fusce suscipit libero eget elit.',
  }
  const examplePostRead: Post = {
    id: 'exampleRead',
    username: 'NYX',
    discussion_name: undefined,
    inserted_at: '2020-04-26T01:23:45',
    content:
      'Aenean fermentum risus id tortor. Nam quis nulla. Donec vitae arcu. Nulla non arcu lacinia neque faucibus fringilla. Curabitur vitae diam non enim vestibulum interdum. Etiam sapien elit, consequat eget, tristique non, venenatis quis, ante.',
  }
  const parser = new Parser(examplePostUnread.content)
  examplePostUnread.parsed = parser.parse()
  const parser2 = new Parser(examplePostRead.content)
  examplePostRead.parsed = parser2.parse()
  return (
    <View style={{ marginTop: 10, borderWidth: 0, borderColor: '#000' }}>
      <SectionHeaderComponent title={'Example Section Header [theme preview]'} />
      {exampleDiscussions.map(d => (
        <DiscussionRowComponent key={d.discussion_id} discussion={d} onPress={() => previewNotification(false)} />
      ))}
      <PostComponent
        post={examplePostUnread}
        nyx={nyx}
        isHeaderInteractive={false}
        isReply={false}
        isUnread={true}
        isHeaderPressable={true}
        onHeaderPress={() => previewNotification(true)}
        onDiscussionDetailShow={() => null}
        onImage={() => null}
        onReminder={() => null}
      />
      <PostComponent
        post={examplePostRead}
        nyx={nyx}
        isHeaderInteractive={false}
        isReply={false}
        isUnread={false}
        isHeaderPressable={true}
        onHeaderPress={() => previewNotification(true)}
        onDiscussionDetailShow={() => null}
        onImage={() => null}
        onReminder={() => null}
      />
    </View>
  )
}
