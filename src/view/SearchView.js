import React, { Component } from 'react'
import { FlatList, View } from 'react-native'
import { Searchbar } from 'react-native-paper'
import { DiscussionRowComponent, UserRowComponent } from '../component'
import { Context, Styling } from '../lib'

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
      posts: [],
      images: [],
      discussions: [],
      events: [],
      advertisements: [],
      users: [],
      isFetching: false,
    }
    this.isDarkMode = true // render called before didMount.. wtf
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
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
    if (res && res.discussion) {
      const { discussions, events, advertisements } = res.discussion
      this.setState({ discussions, events, advertisements, users: [] })
    } else if (res && res.user) {
      const { exact, friends, others } = res.user
      this.setState({ users: [...exact, ...friends, ...others], discussions: [] })
    }
  }

  render() {
    return (
      <View style={[Styling.groups.themeComponent(this.isDarkMode), { height: '100%' }]}>
        <Searchbar
          placeholder="Search .."
          onChangeText={searchPhrase => this.setSearchPhrase(searchPhrase)}
          value={`${this.state.searchPhrase}`}
        />
        {this.state.discussions?.length > 0 && (
          <FlatList
            data={this.state.discussions}
            extraData={this.state}
            keyExtractor={(item, index) => `${item.id}`}
            refreshing={this.state.isFetching}
            style={{
              height: '100%',
              paddingTop: Styling.metrics.block.small,
              backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.lighter,
            }}
            renderItem={({ item }) => (
              <DiscussionRowComponent
                key={item.id}
                discussion={item}
                isDarkMode={this.isDarkMode}
                onPress={discussionId => this.props.onNavigation({ discussionId })}
              />
            )}
          />
        )}
        {this.state.users?.length > 0 && (
          <FlatList
            data={this.state.users}
            extraData={this.state}
            keyExtractor={(item, index) => `${item.username}`}
            refreshing={this.state.isFetching}
            style={{
              height: '100%',
              paddingTop: Styling.metrics.block.small,
              backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.lighter,
            }}
            renderItem={({ item }) => (
              <UserRowComponent
                key={item.username}
                user={item}
                isDarkMode={this.isDarkMode}
                onPress={() => this.props.onUserSelected(item.username)}
              />
            )}
          />
        )}
      </View>
    )
  }
}
