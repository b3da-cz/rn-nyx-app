import React from 'react'
import { ScrollView, RefreshControl, View, LayoutAnimation } from 'react-native'
import { DiscussionRowComponent } from '../component'
import { LayoutAnimConf, Styling } from '../lib'
import { BaseDiscussionListView } from './BaseDiscussionListView'

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

  async getList(isAnimated = false) {
    this.setState({ isFetching: true })
    const res = await this.nyx.getHistory(this.state.isShowingRead)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
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
                  onLongPress={id => this.showDiscussionStats(id)}
                />
              ))}
          </View>
        </ScrollView>
        {this.renderFAB()}
      </View>
    )
  }
}
