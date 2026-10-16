import React, { Component, useState } from 'react'
import { LayoutAnimation, SectionList, View } from 'react-native'
import { Menu, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import {
  DiscussionRowComponent,
  FetchProgressComponent,
  PostComponent,
  SearchFieldComponent,
  SectionHeaderComponent,
  UserRowComponent,
} from '../component'
import {
  MainContext,
  LayoutAnimConf,
  Nyx,
  t,
  Theme,
  SEARCH_KINDS,
  emptyFetchProgress,
  FetchProgressEvent,
  FetchProgressState,
  loadSearch,
  mergeSearchPosts,
  preparePosts,
  reduceFetchProgress,
  resolveFetchProgressMode,
  revealImageInPosts,
  galleryImagesFromPosts,
  toGalleryImages,
} from '../lib'
import type { SearchKind, SearchSection } from '../lib'

type Props = {
  onNavigation: Function
  onUserSelected: Function
  onImages: Function
}
type State = {
  searchPhrase: string
  kind: SearchKind
  sectionedSearchResults: SearchSection[]
  posts: any[]
  postsEnd: boolean
  isFetching: boolean
  fetchProgress: FetchProgressState
  theme?: Theme
}
const kindLabel = (kind: SearchKind) => {
  if (kind === 'events') {
    return t('events.title')
  }
  return t(kind)
}

export class SearchView extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  nyx?: Nyx
  filters: string[] = []
  blockedUsers: string[] = []
  searchSeq = 0
  _revealQueue: Promise<any> = Promise.resolve()
  constructor(props) {
    super(props)
    this.state = {
      searchPhrase: '',
      kind: 'all',
      sectionedSearchResults: [],
      posts: [],
      postsEnd: false,
      isFetching: false,
      fetchProgress: emptyFetchProgress(),
      theme: undefined,
    }
  }

  componentDidMount() {
    this.init()
  }

  init() {
    this.nyx = this.context.nyx
    this.filters = this.context.filters || []
    this.blockedUsers = this.context.blockedUsers || []
    this.setState({ theme: this.context.theme })
  }

  setSearchPhrase(searchPhrase, andDoSearch = true) {
    this.setState({ searchPhrase })
    if (andDoSearch) {
      this.search(searchPhrase, this.state.kind)
    }
  }

  setKind(kind: SearchKind) {
    this.setState({ kind, posts: [], postsEnd: false, sectionedSearchResults: [] })
    this.search(this.state.searchPhrase, kind)
  }

  async search(searchPhrase: string, kind: SearchKind = this.state.kind, fromId?: number) {
    if (!this.nyx || !searchPhrase || searchPhrase.length < 3) {
      this.setState({ isFetching: false, sectionedSearchResults: [], posts: [], postsEnd: false })
      return
    }
    const seq = ++this.searchSeq
    const request = { id: 'request', label: t('search.title'), done: 0, total: 1 }
    this.setState({ isFetching: true, fetchProgress: reduceFetchProgress(emptyFetchProgress(), request) })
    let sections: SearchSection[] = []
    let posts: any[] = []
    try {
      sections = await loadSearch(this.nyx.api, searchPhrase, kind, this.filters, this.blockedUsers, fromId)
      if (seq === this.searchSeq) {
        this.setState(state => ({ fetchProgress: reduceFetchProgress(state.fetchProgress, { ...request, done: 1 }) }))
      }
      if (seq !== this.searchSeq) {
        return
      }
      const incoming = sections[0]?.data || []
      posts = kind === 'posts' ? (fromId ? mergeSearchPosts(this.state.posts, incoming) : incoming) : []
      if (kind === 'posts' && posts.length) {
        posts = await preparePosts(
          posts,
          [],
          true,
          this.context?.theme?.metrics?.fontSizes?.p,
          this.context?.config?.imageDownloadMaxKb,
          event => {
            if (seq !== this.searchSeq) {
              return
            }
            this.setState(state => ({ fetchProgress: reduceFetchProgress(state.fetchProgress, event) }))
          },
        )
      }
    } catch (e) {
      console.warn(e)
      if (kind === 'posts') {
        posts = []
      }
    }
    if (seq !== this.searchSeq) {
      return
    }
    const readyPosts = kind === 'posts' && posts[0] && !posts[0].parsed ? [] : posts
    const sectioned =
      kind === 'posts' ? (readyPosts.length ? [{ key: 'posts' as const, data: readyPosts }] : []) : sections
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({
      posts: readyPosts,
      postsEnd: kind === 'posts' && !!fromId && readyPosts.length === this.state.posts.length,
      sectionedSearchResults: sectioned,
      isFetching: false,
    })
  }

  showImages(image) {
    this.revealPostImage(image)
    const { images, imgIndex } = toGalleryImages(image, galleryImagesFromPosts(this.state.posts))
    this.props.onImages(images, imgIndex)
  }

  revealPostImage(image) {
    this._revealQueue = this._revealQueue.then(() => this.revealPostImageNow(image)).catch(e => console.warn(e))
    return this._revealQueue
  }

  async revealPostImageNow(image) {
    const nextPosts = await revealImageInPosts(
      this.state.posts.slice(),
      image,
      this.context?.theme?.metrics?.fontSizes?.p,
    )
    this.setState({
      posts: nextPosts.slice(),
      sectionedSearchResults:
        this.state.kind === 'posts' ? [{ key: 'posts', data: nextPosts.slice() }] : this.state.sectionedSearchResults,
    })
  }

  loadOlderPosts() {
    const { kind, posts, postsEnd, searchPhrase, isFetching } = this.state
    if (kind !== 'posts' || isFetching || postsEnd || !posts.length) {
      return
    }
    const last = posts[posts.length - 1]
    if (last?.id) {
      this.search(searchPhrase, 'posts', last.id)
    }
  }

  render() {
    const { theme } = this.state
    if (!theme) {
      return null
    }
    const listEmpty = !this.state.sectionedSearchResults.some(section => section.data?.length)
    const loadSteps = this.state.fetchProgress?.steps || []
    const progressMode = resolveFetchProgressMode(this.context?.config, 'enter')
    const showProgress = progressMode !== 'off' && this.state.isFetching
    const loadActive = showProgress && loadSteps.length > 0
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SearchFieldComponent
          placeholder={`${t('search.do')} ..`}
          onChangeText={searchPhrase => this.setSearchPhrase(searchPhrase)}
          value={`${this.state.searchPhrase}`}
        />
        <SearchKindSwitch kind={this.state.kind} theme={theme} onChange={kind => this.setKind(kind)} />
        {loadActive && !listEmpty && (
          <FetchProgressComponent
            progress={this.state.fetchProgress}
            fill={false}
            detailed={progressMode === 'detailed'}
          />
        )}
        <SectionList
          sections={this.state.sectionedSearchResults}
          stickySectionHeadersEnabled={this.state.kind === 'all'}
          initialNumToRender={30}
          keyExtractor={item => `${item.id || item.username}`}
          style={{ flex: 1, marginTop: theme.metrics.blocks.small }}
          refreshing={this.state.isFetching && !showProgress}
          onRefresh={() => this.search(this.state.searchPhrase, this.state.kind)}
          contentContainerStyle={listEmpty ? { flexGrow: 1 } : undefined}
          ListEmptyComponent={
            showProgress ? (
              <FetchProgressComponent progress={this.state.fetchProgress} fill detailed={progressMode === 'detailed'} />
            ) : null
          }
          onEndReached={() => this.loadOlderPosts()}
          onEndReachedThreshold={0.4}
          renderSectionHeader={({ section }) =>
            this.state.kind === 'all' ? <SectionHeaderComponent title={kindLabel(section.key)} /> : null
          }
          renderItem={({ item, section }) => {
            if (section.key === 'users') {
              return (
                <UserRowComponent
                  key={item.username}
                  user={item}
                  onPress={() => this.props.onUserSelected(item.username)}
                />
              )
            }
            if (section.key === 'posts') {
              const openPost = () => this.props.onNavigation({ discussionId: item.discussion_id, postId: item.id })
              return (
                <PostComponent
                  key={item.id}
                  post={item}
                  nyx={this.nyx!}
                  headerSwipeable
                  isHeaderInteractive
                  isHeaderPressable
                  onHeaderPress={openPost}
                  onBodyPress={openPost}
                  onDiscussionDetailShow={(discussionId, postId) =>
                    this.props.onNavigation({ discussionId, postId })
                  }
                  onImage={image => this.showImages(image)}
                  onDelete={() => null}
                  searchQuery={this.state.searchPhrase}
                />
              )
            }
            return (
              <DiscussionRowComponent
                key={item.id}
                discussion={item}
                isAccented={true}
                onPress={discussionId => this.props.onNavigation({ discussionId })}
              />
            )
          }}
        />
      </View>
    )
  }
}

const SearchKindSwitch = ({
  kind,
  theme,
  onChange,
}: {
  kind: SearchKind
  theme: Theme
  onChange: (kind: SearchKind) => void
}) => {
  const [rowWidth, setRowWidth] = useState(0)
  const [widths, setWidths] = useState<Record<string, number>>({})
  const [menu, setMenu] = useState(false)
  const pad = theme.metrics.blocks.small * 2
  const measured = SEARCH_KINDS.every(key => (widths[key] || 0) > 0)
  const needed =
    SEARCH_KINDS.reduce((sum, key) => sum + (widths[key] || 0) + pad, 0) + Math.max(0, SEARCH_KINDS.length - 1)
  const fits = measured && rowWidth > 0 && needed <= rowWidth
  const bar = {
    minHeight: 44,
    backgroundColor: theme.colors.row,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  }
  return (
    <View onLayout={event => setRowWidth(event.nativeEvent.layout.width)} style={bar}>
      {fits ? (
        <View style={{ flexDirection: 'row', minHeight: 44 }}>
          {SEARCH_KINDS.map((key, index) => {
            const selected = key === kind
            return (
              <TouchableRipple
                key={key}
                rippleColor={theme.colors.ripple}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => !selected && onChange(key)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: theme.metrics.blocks.small,
                  backgroundColor: selected ? theme.colors.card : theme.colors.transparent,
                  borderRightWidth: index < SEARCH_KINDS.length - 1 ? 1 : 0,
                  borderRightColor: theme.colors.border,
                }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: selected ? theme.colors.text : theme.colors.faded,
                    fontSize: theme.metrics.fontSizes.small,
                    fontWeight: selected ? '700' : '400',
                    textAlign: 'center',
                  }}>
                  {kindLabel(key)}
                </Text>
              </TouchableRipple>
            )
          })}
        </View>
      ) : measured ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              paddingHorizontal: theme.metrics.blocks.medium,
              color: theme.colors.text,
              fontSize: theme.metrics.fontSizes.p,
              fontWeight: '700',
            }}>
            {kindLabel(kind)}
          </Text>
          <Menu
            visible={menu}
            onDismiss={() => setMenu(false)}
            anchor={
              <TouchableRipple
                rippleColor={theme.colors.ripple}
                accessibilityRole="button"
                onPress={() => setMenu(true)}
                style={{
                  minHeight: 44,
                  minWidth: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name="chevron-down" size={theme.metrics.fontSizes.p} color={theme.colors.text} />
              </TouchableRipple>
            }>
            {SEARCH_KINDS.map(key => (
              <Menu.Item
                key={key}
                title={kindLabel(key)}
                onPress={() => {
                  setMenu(false)
                  if (key !== kind) {
                    onChange(key)
                  }
                }}
              />
            ))}
          </Menu>
        </View>
      ) : null}
      <View pointerEvents="none" style={{ position: 'absolute', opacity: 0, left: 0, top: 0 }}>
        {SEARCH_KINDS.map(key => (
          <Text
            key={key}
            onLayout={event => {
              const width = event.nativeEvent.layout.width
              setWidths(prev => (prev[key] === width ? prev : { ...prev, [key]: width }))
            }}
            style={{
              alignSelf: 'flex-start',
              fontSize: theme.metrics.fontSizes.small,
              fontWeight: '700',
            }}>
            {kindLabel(key)}
          </Text>
        ))}
      </View>
    </View>
  )
}
