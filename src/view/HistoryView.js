import React, { Component } from 'react'
import { ActivityIndicator, ScrollView, RefreshControl, View } from 'react-native'
import { DiscussionRowComponent } from '../component'
import { Context, Styling } from '../lib'

type Props = {
  navigation: any,
  onDetailShow: Function,
}
export class HistoryView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      discussions: [],
      isFetching: false,
    }
    this.navFocusListener = null
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.navFocusListener = this.props.navigation.addListener('focus', () => {
      setTimeout(() => this.getHistory(), 100)
    })
    setTimeout(() => this.getHistory(), 100)
  }

  componentWillUnmount() {
    if (this.navFocusListener) {
      this.navFocusListener()
    }
  }

  async getHistory() {
    this.setState({ isFetching: true })
    const res = await this.nyx.getHistory()
    this.setState({ discussions: res.discussions, isFetching: false })
  }

  showDiscussion(id) {
    this.props.onDetailShow(id)
  }

  render() {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[Styling.groups.themeComponent(this.isDarkMode), { height: '100%' }]}
        refreshControl={<RefreshControl refreshing={this.state.isFetching} onRefresh={() => this.getHistory()} />}>
        <View>
          {this.state.discussions?.length > 0 &&
            this.state.discussions.map(d => (
              <DiscussionRowComponent
                key={d.discussion_id}
                discussion={d}
                isDarkMode={this.isDarkMode}
                onPress={id => this.showDiscussion(id)}
              />
            ))}
          {this.state.discussions && this.state.discussions.length === 0 && (
            <View
              style={[
                {
                  height: Styling.metrics.window().height - 60,
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                Styling.groups.themeComponent(this.isDarkMode),
              ]}>
              <ActivityIndicator size="large" color={Styling.colors.primary} style={{ marginBottom: 200 }} />
            </View>
          )}
        </View>
      </ScrollView>
    )
  }
}
