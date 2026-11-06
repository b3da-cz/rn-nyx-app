import React, { Component } from 'react'
import { FlatList, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { PostComponent, StackHeaderComponent } from '../component'
import {
  confirm,
  CustomReminderList,
  deleteCustomReminderList,
  galleryImagesFromPosts,
  getCustomReminderList,
  MainContext,
  Nyx,
  removePostFromCustomList,
  revealImageInPosts,
  subscribeCustomReminders,
  t,
  Theme,
  toGalleryImages,
} from '../lib'

type Props = {
  navigation: any
  route: any
}

type State = {
  list: CustomReminderList | null
  isFetching: boolean
  theme?: Theme
}

export class CustomReminderListView extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  nyx?: Nyx
  unsubscribeCustomReminders?: () => void
  _revealQueue: Promise<any> = Promise.resolve()

  constructor(props) {
    super(props)
    this.state = {
      list: null,
      isFetching: false,
      theme: undefined,
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.setState({ theme: this.context.theme })
    this.loadList()
    this.unsubscribeCustomReminders = subscribeCustomReminders(() => {
      this.loadList()
    })
  }

  componentWillUnmount() {
    if (this.unsubscribeCustomReminders) {
      this.unsubscribeCustomReminders()
    }
  }

  async loadList() {
    const listId = this.props.route?.params?.listId
    if (!listId) return
    const list = await getCustomReminderList(listId)
    this.setState({ list })
  }

  async onRemovePost(post: any) {
    const listId = this.state.list?.id || this.props.route?.params?.listId
    if (!listId || !post?.id) return
    await removePostFromCustomList(listId, post.id)
    if (this.state.list) {
      const nextPosts = (this.state.list.posts || []).filter(p => String(p.id) !== String(post.id))
      this.setState({
        list: {
          ...this.state.list,
          posts: nextPosts,
          updatedAt: Date.now(),
        },
      })
    }
  }

  async onDeleteList() {
    const listId = this.state.list?.id || this.props.route?.params?.listId
    if (!listId) return
    const ok = await confirm(
      t('reminders.deleteList') || 'Smazat seznam',
      t('reminders.deleteListConfirm') || 'Opravdu chcete smazat tento seznam?',
    )
    if (ok) {
      await deleteCustomReminderList(listId)
      this.props.navigation.goBack()
    }
  }

  showPost(discussionId: number, postId: number) {
    this.props.navigation.push('discussion', { discussionId, postId })
  }

  showImages(image: any) {
    this.revealPostImage(image)
    const list = galleryImagesFromPosts(this.state.list?.posts || [])
    const { images, imgIndex } = toGalleryImages(image, list)
    this.props.navigation.navigate('gallery', {
      images,
      imgIndex,
      onViewImage: (img: any) => this.revealPostImage(img),
    })
  }

  revealPostImage(image: any) {
    this._revealQueue = this._revealQueue
      .then(() => this.revealPostImageNow(image))
      .catch(e => console.warn(e))
    return this._revealQueue
  }

  async revealPostImageNow(image: any) {
    if (!this.state.list) return
    const fontSize = this.context?.theme?.metrics?.fontSizes?.p
    const posts = await revealImageInPosts((this.state.list.posts || []).slice(), image, fontSize)
    this.setState({
      list: {
        ...this.state.list,
        posts,
      },
    })
  }

  render() {
    const theme = this.context.theme || this.state.theme
    const colors = theme?.colors || ({} as any)
    const fontSizes = theme?.metrics?.fontSizes || { h3: 16, p: 14, small: 12 }
    const list = this.state.list
    const title = list?.name || this.props.route?.params?.listName || 'Seznam'
    const posts = list?.posts || []

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StackHeaderComponent
          navigation={this.props.navigation}
          options={{ title }}
          back={{ title: '' }}
          theme={theme}
          right={
            <TouchableRipple
              onPress={() => this.onDeleteList()}
              rippleColor={colors.ripple}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trash-2" size={20} color={colors.disabled || '#888'} />
            </TouchableRipple>
          }
        />
        <FlatList
          data={posts}
          keyExtractor={item => String(item.id)}
          extraData={this.state}
          initialNumToRender={20}
          style={{ flex: 1 }}
          contentContainerStyle={posts.length === 0 ? { flexGrow: 1 } : undefined}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 24,
              }}>
              <Icon name="bookmark" size={48} color={colors.secondary || '#4dabf7'} style={{ marginBottom: 12 }} />
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSizes.h3,
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 6,
                }}>
                Tento seznam je zatím prázdný
              </Text>
              <Text
                style={{
                  color: colors.faded || '#888',
                  fontSize: fontSizes.p,
                  textAlign: 'center',
                }}>
                Příspěvek sem přidáte kliknutím na zvoneček u libovolného příspěvku a výběrem tohoto seznamu.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PostComponent
              key={item.id}
              post={item}
              nyx={this.nyx!}
              isHeaderInteractive={true}
              isReply={false}
              isUnread={item.new}
              isHeaderPressable={item.discussion_id > 0}
              mailMode={item.location === 'mail'}
              onHeaderPress={() => (item.discussion_id > 0 ? this.showPost(item.discussion_id, item.id) : null)}
              onDiscussionDetailShow={(discussionId, postId) => this.showPost(discussionId, postId)}
              onImage={image => this.showImages(image)}
              onReminder={post => this.onRemovePost(post)}
            />
          )}
        />
      </View>
    )
  }
}
