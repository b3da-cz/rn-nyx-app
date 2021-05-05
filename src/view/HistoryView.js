import React from 'react'
import { ActivityIndicator, ScrollView, RefreshControl, View } from 'react-native'
import { FAB } from 'react-native-paper'
import { DiscussionRowComponent } from '../component'
import { Styling } from '../lib'
import { BaseDiscussionListView } from '../view'

type Props = {
  navigation: any,
  onDetailShow: Function,
}
export class HistoryView extends BaseDiscussionListView<Props> {
  constructor(props) {
    super(props)
    this.state = {
      discussions: [],
      isShowingRead: false,
      isFetching: false,
    }
  }

  async getList() {
    this.setState({ isFetching: true })
    const res = await this.nyx.getHistory(this.state.isShowingRead)
    this.setState({ discussions: res.discussions, isFetching: false })
  }

  render() {
    return (
      <View style={[Styling.groups.themeComponent(this.isDarkMode), { height: '100%' }]}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={[Styling.groups.themeComponent(this.isDarkMode), { height: '100%' }]}
          refreshControl={<RefreshControl refreshing={this.state.isFetching} onRefresh={() => this.getList()} />}>
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
        <FAB
          small={true}
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            top: 0,
            backgroundColor: Styling.colors.darker,
            opacity: 0.75,
          }}
          icon={this.state.isShowingRead ? 'star-outline' : 'star'}
          visible={true}
          onPress={() => this.toggleRead(this.state.isShowingRead)}
        />
      </View>
    )
  }
}
