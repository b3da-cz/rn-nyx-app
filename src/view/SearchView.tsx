import React, { Component } from 'react'
import { LayoutAnimation, SectionList, View } from 'react-native'
import { Searchbar } from 'react-native-paper'
import { DiscussionRowComponent, SectionHeaderComponent, UserRowComponent } from '../component'
import { MainContext, LayoutAnimConf, Nyx, t, Theme, filterDiscussions } from '../lib'

type Props = {
  onNavigation: Function
  onUserSelected: Function
}
type State = {
  searchPhrase: string
  sectionedSearchResults: any[]
  posts: any[]
  images: any[]
  discussions: any[]
  events: any[]
  advertisements: any[]
  users: any[]
  isFetching: boolean
  theme?: Theme
}
export class SearchView extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  nyx?: Nyx
  filters: any[] = []
  constructor(props) {
    super(props)
    this.state = {
      searchPhrase: '',
      sectionedSearchResults: [],
      posts: [],
      images: [],
      discussions: [],
      events: [],
      advertisements: [],
      users: [],
      isFetching: false,
      theme: undefined,
    }
  }

  componentDidMount() {
    this.init()
  }

  init() {
    this.nyx = this.context.nyx
    this.filters = [...this.context.filters, ...this.context.blockedUsers]
    this.setState({ theme: this.context.theme })
  }

  setSearchPhrase(searchPhrase, andDoSearch = true) {
    this.setState({ searchPhrase })
    if (andDoSearch) {
      this.search(searchPhrase)
    }
  }

  async search(searchPhrase) {
    if (!searchPhrase || (searchPhrase && searchPhrase.length < 3)) {
      return
    }
    this.setState({ isFetching: true })
    const res = await this.nyx?.api.search(searchPhrase, true)
    const { discussions, events, advertisements } = res?.discussion || {}
    const { exact, friends, others } = res?.user || {}
    const users = [...(exact || []), ...(friends || []), ...(others || [])]
    const sectioned = [
      { title: t('advertisements'), data: advertisements || [] },
      { title: t('discussions'), data: filterDiscussions(discussions || [], this.filters) || [] },
      // { title: t('events'), data: events || [] },
      // { title: t('posts'), data: posts || [] },
      { title: t('users'), data: users || [] },
    ]
    sectioned.forEach((section, i) => {
      if (section.data.length > 0) {
        sectioned[i].data = Array.from(new Set([...section.data]))
      } else {
        delete sectioned[i]
      }
    })
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({
      discussions,
      events,
      advertisements,
      users,
      sectionedSearchResults: sectioned.filter(s => !!s),
    })
  }

  render() {
    const { theme } = this.state
    if (!theme) {
      return null
    }
    return (
      <View style={{ backgroundColor: theme.colors.background, height: '100%' }}>
        <Searchbar
          placeholder={`${t('search.do')} ..`}
          onChangeText={searchPhrase => this.setSearchPhrase(searchPhrase)}
          value={`${this.state.searchPhrase}`}
        />
        <SectionList
          sections={this.state.sectionedSearchResults}
          stickySectionHeadersEnabled={true}
          initialNumToRender={30}
          keyExtractor={item => item.id}
          style={{ marginTop: theme.metrics.blocks.small }}
          refreshing={this.state.isFetching}
          renderSectionHeader={({ section: { title } }) => <SectionHeaderComponent title={title} />}
          renderItem={({ item, section: { title } }) => {
            switch (title) {
              case t('posts'):
              case t('discussions'):
              case t('advertisements'):
              default:
                return (
                  <DiscussionRowComponent
                    key={item.id}
                    discussion={item}
                    isAccented={true}
                    onPress={discussionId => this.props.onNavigation({ discussionId })}
                  />
                )
              case t('users'):
                return (
                  <UserRowComponent
                    key={item.username}
                    user={item}
                    onPress={() => this.props.onUserSelected(item.username)}
                  />
                )
            }
          }}
        />
      </View>
    )
  }
}
