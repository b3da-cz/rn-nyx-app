import React, { Component } from 'react'
import { ActivityIndicator, ScrollView, Text, RefreshControl, TouchableOpacity, View } from 'react-native'
import { Nyx, Styling } from '../lib'

type Props = {
  isDarkMode: boolean,
  nyx: Nyx,
  onDetailShow: Function,
}
export class HistoryView extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      discussions: [],
      isFetching: false,
    }
    setTimeout(() => this.getHistory(), 10)
  }

  async getHistory() {
    this.setState({ isFetching: true })
    const res = await this.props.nyx.getHistory()
    this.setState({ discussions: res.discussions, isFetching: false })
  }

  showDiscussion(d) {
    this.props.onDetailShow(d.discussion_id)
  }

  render() {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[
          Styling.groups.themeView(this.props.isDarkMode),
          { maxHeight: Math.max(Styling.metrics.window().height, Styling.metrics.window().width) - 60 },
        ]}
        refreshControl={<RefreshControl refreshing={this.state.isFetching} onRefresh={() => this.getHistory()} />}>
        <View>
          {this.state.discussions &&
            this.state.discussions.length > 0 &&
            this.state.discussions.map(d => (
              <TouchableOpacity
                key={d.discussion_id}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  borderBottomWidth: 1,
                  borderColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white,
                }}
                onPress={() => this.showDiscussion(d)}>
                <Text style={[Styling.groups.link(), { paddingBottom: 5, width: '80%', fontSize: 14 }]}>
                  {d.full_name}
                </Text>
                <Text
                  style={[
                    Styling.groups.themeView(this.props.isDarkMode),
                    { width: '20%', textAlign: 'right', fontSize: 14 },
                  ]}>
                  {d.new_posts_count}
                  {d.new_images_count > 0 ? ` [${d.new_images_count}]` : ''}
                </Text>
              </TouchableOpacity>
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
                Styling.groups.themeComponent(this.props.isDarkMode),
              ]}>
              <ActivityIndicator size="large" color={Styling.colors.primary} style={{ marginBottom: 200 }} />
            </View>
          )}
        </View>
      </ScrollView>
    )
  }
}
