import React from 'react'
import { ScrollView, RefreshControl, View, LayoutAnimation } from 'react-native'
import { DiscussionRowComponent } from '../component'
import { filterDiscussions, LayoutAnimConf, recountDiscussionList, Theme } from '../lib'
import { BaseDiscussionListView } from './BaseDiscussionListView'

type Props = {
  navigation: any
  onDetailShow: Function
}
type State = {
  discussions: any[]
  isShowingRead: boolean
  isFetching: boolean
  theme?: Theme
}
export class HistoryView extends BaseDiscussionListView<Props> {
  state: Readonly<State>
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
    const res = await this.nyx?.api.getHistory(this.state.isShowingRead)
    if (isAnimated) {
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    }
    this.setState({
      discussions: filterDiscussions(recountDiscussionList(res?.discussions || []), this.filters),
      isFetching: false,
    })
  }

  render() {
    const { theme } = this.state
    if (!theme) {
      return null
    }
    return (
      <View style={{ backgroundColor: theme.colors.background, height: '100%' }}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: theme.colors.background, height: '100%' }}
          refreshControl={<RefreshControl refreshing={this.state.isFetching} onRefresh={() => this.getList()} />}>
          <View>
            {this.state.discussions?.length > 0 &&
              this.state.discussions.map(d => (
                <DiscussionRowComponent
                  key={d.discussion_id}
                  discussion={d}
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
