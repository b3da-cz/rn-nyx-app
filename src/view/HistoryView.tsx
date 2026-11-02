import React from 'react'
import { ScrollView, RefreshControl, View, LayoutAnimation } from 'react-native'
import { DiscussionRowComponent } from '../component'
import {
  filterDiscussions,
  LayoutAnimConf,
  readDiscussionListCache,
  recountDiscussionList,
  rememberHistoryOnList,
  updateDiscussionListCache,
  Theme,
} from '../lib'
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
      isShowingRead: true,
      isFetching: false,
    }
  }

  init() {
    super.init()
    const configShowingRead = this.context?.config?.isShowingReadOnLists
    if (typeof configShowingRead === 'boolean') {
      this.setState({ isShowingRead: configShowingRead })
    }
  }

  cacheOn() {
    return this.context?.config?.isDiscussionCacheEnabled !== false
  }

  showDiscussions(discussions, isAnimated = false) {
    if (isAnimated) {
      LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    }
    this.setState({
      discussions: filterDiscussions(recountDiscussionList(discussions || []), this.filters),
      isFetching: false,
    })
  }

  async saveHistory(discussions) {
    if (!this.cacheOn()) {
      return
    }
    await updateDiscussionListCache(list => rememberHistoryOnList(list, discussions, this.state.isShowingRead))
  }

  async cachedHistory() {
    if (!this.cacheOn()) {
      return null
    }
    const list = await readDiscussionListCache()
    return list.history
  }

  hasData(): boolean {
    return Array.isArray(this.state.discussions) && this.state.discussions.length > 0
  }

  handleDiscussionPress = (id: any, lastSeenPostId?: any) => {
    this.showDiscussion(id, lastSeenPostId)
  }

  handleDiscussionLongPress = (id: any) => {
    this.showDiscussionStats(id)
  }

  async getList(isAnimated = false, force = false) {
    const configShowingRead = this.context?.config?.isShowingReadOnLists
    const showingRead = typeof configShowingRead === 'boolean' ? configShowingRead : this.state.isShowingRead
    if (showingRead !== this.state.isShowingRead) {
      this.setState({ isShowingRead: showingRead })
    }
    const hasData = this.hasData()
    if (!hasData || force) {
      this.setState({ isFetching: true })
    }
    this.nyx?.holdErrors()
    let servedFromCache = false
    try {
      let res
      try {
        res = await this.nyx?.api.getHistory(showingRead)
      } catch (e) {
        res = null
      }
      if (this.isUnmounted) {
        return
      }
      if (!res?.error && Array.isArray(res?.discussions)) {
        this.lastFetchAt = Date.now()
        this.showDiscussions(res.discussions, isAnimated)
        if (res.discussions.length > 0 || showingRead) {
          this.saveHistory(res.discussions).catch(e => console.warn(e))
        }
        return
      }
      if (this.state.discussions?.length) {
        this.setState({ isFetching: false })
        servedFromCache = true
        return
      }
      const cached = await this.cachedHistory()
      if (cached?.discussions?.length) {
        this.lastFetchAt = Date.now()
        this.showDiscussions(cached.discussions, isAnimated)
        servedFromCache = true
        return
      }
      this.setState({ isFetching: false })
    } finally {
      this.nyx?.releaseErrors(servedFromCache)
    }
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
          refreshControl={<RefreshControl refreshing={this.state.isFetching} onRefresh={() => this.getList(false, true)} />}>
          <View>
            {this.state.discussions?.length > 0 &&
              this.state.discussions.map(d => (
                <DiscussionRowComponent
                  key={d.discussion_id}
                  discussion={d}
                  onPress={this.handleDiscussionPress}
                  onLongPress={this.handleDiscussionLongPress}
                />
              ))}
          </View>
        </ScrollView>
        {this.renderFAB()}
      </View>
    )
  }
}
