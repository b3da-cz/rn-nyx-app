import React, { Component } from 'react'
import { ActivityIndicator, ScrollView, RefreshControl, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { Context, Styling } from '../lib'

type Props = {
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
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.getHistory()
  }

  async getHistory() {
    this.setState({ isFetching: true })
    const res = await this.nyx.getHistory()
    this.setState({ discussions: res.discussions, isFetching: false })
  }

  showDiscussion(d) {
    this.props.onDetailShow(d.discussion_id)
  }

  render() {
    const unreadRowColor = (unreads, replies) =>
      replies > 0
        ? Styling.colors.secondary
        : unreads > 0
        ? Styling.colors.primary
        : this.isDarkMode
        ? Styling.colors.light
        : Styling.colors.dark
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[Styling.groups.themeComponent(this.isDarkMode), { height: '100%' }]}
        refreshControl={<RefreshControl refreshing={this.state.isFetching} onRefresh={() => this.getHistory()} />}>
        <View>
          {this.state.discussions &&
            this.state.discussions.length > 0 &&
            this.state.discussions.map(d => (
              <TouchableRipple
                key={d.discussion_id}
                rippleColor={'rgba(18,146,180, 0.3)'}
                style={{
                  backgroundColor: this.isDarkMode ? Styling.colors.darker : Styling.colors.lighter,
                  paddingVertical: Styling.metrics.block.medium,
                  paddingHorizontal: Styling.metrics.block.small,
                  marginBottom: Styling.metrics.block.small,
                }}
                onPress={() => this.showDiscussion(d)}>
                <View style={{ flexDirection: 'row' }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      {
                        width: '75%',
                        fontSize: 14,
                        color: unreadRowColor(d.new_posts_count, d.new_replies_count),
                      },
                    ]}>
                    {d.full_name}
                  </Text>
                  <Text
                    style={[
                      {
                        width: '25%',
                        textAlign: 'right',
                        fontSize: 14,
                        color: unreadRowColor(d.new_posts_count, d.new_replies_count),
                      },
                    ]}>
                    {d.new_posts_count}
                    {`${d.new_replies_count > 0 ? `+${d.new_replies_count}` : ''}  `}
                    {d.new_images_count > 0 ? (
                      <Icon name="image" size={14} color={unreadRowColor(d.new_posts_count)} />
                    ) : (
                      ''
                    )}
                    {d.new_images_count > 0 ? `${d.new_images_count}` : ''}
                    {d.new_links_count > 0 ? (
                      <Icon name="link" size={14} color={unreadRowColor(d.new_posts_count)} />
                    ) : (
                      ''
                    )}
                    {d.new_links_count > 0 ? `${d.new_links_count}` : ''}
                  </Text>
                </View>
              </TouchableRipple>
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
