import React, { Component } from 'react'
import { LayoutAnimation, SectionList, View } from 'react-native'
import { Searchbar } from 'react-native-paper'
import { DiscussionRowComponent, SectionHeaderComponent, UserRowComponent } from '../component'
import { Context, Styling, t } from '../lib'

type Props = {
  onNavigation: Function,
  onUserSelected: Function,
}
export class SearchView extends Component<Props> {
  static contextType = Context
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
    }
  }

  componentDidMount() {
    this.init()
  }

  init() {
    this.nyx = this.context.nyx
    this.setState({ isDarkMode: this.context.theme === 'dark' })
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
    const res = await this.nyx.search({ phrase: searchPhrase, isUnified: true })
    const { discussions, events, advertisements } = res.discussion || {}
    const { exact, friends, others } = res.user || {}
    const users = [...(exact || []), ...(friends || []), ...(others || [])]
    const sectioned = [
      { title: t('advertisements'), data: advertisements || [] },
      { title: t('discussions'), data: discussions || [] },
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear)
    this.setState({
      discussions,
      events,
      advertisements,
      users,
      sectionedSearchResults: sectioned.filter(s => !!s),
    })
  }

  render() {
    return (
      <View style={[Styling.groups.themeComponent(this.state.isDarkMode), { height: '100%' }]}>
        <Searchbar
          placeholder={`${t('search.do')} ..`}
          onChangeText={searchPhrase => this.setSearchPhrase(searchPhrase)}
          value={`${this.state.searchPhrase}`}
        />
        <SectionList
          sections={this.state.sectionedSearchResults}
          stickySectionHeadersEnabled={true}
          initialNumToRender={30}
          keyExtractor={(item, index) => item.id}
          style={{ marginTop: Styling.metrics.block.xsmall }}
          refreshing={this.state.isFetching}
          renderSectionHeader={({ section: { title } }) => (
            <SectionHeaderComponent isDarkMode={this.state.isDarkMode} title={title} />
          )}
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
                    isDarkMode={this.state.isDarkMode}
                    isAccented={true}
                    onPress={discussionId => this.props.onNavigation({ discussionId })}
                  />
                )
              case t('users'):
                return (
                  <UserRowComponent
                    key={item.username}
                    user={item}
                    isDarkMode={this.state.isDarkMode}
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
