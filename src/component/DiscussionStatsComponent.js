import React, { Component } from 'react'
import { ScrollView, RefreshControl, Text, View, LayoutAnimation } from 'react-native'
import { UserRowComponent } from '../component'
import { Context, formatDate, LayoutAnimConf, Styling, t } from '../lib'

type Props = {
  id: number,
}
export class DiscussionStatsComponent extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      visits: [],
      isFetching: false,
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.getVisits(true)
  }

  async getVisits(isAnimated = false) {
    this.setState({ isFetching: true })
    const res = await this.nyx.getDiscussionStats(this.props.id)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ visits: res.visits, isFetching: false })
  }

  render() {
    return (
      <View style={[Styling.groups.themeComponent(this.isDarkMode), { height: '100%' }]}>
        {this.state.visits?.length > 0 && (
          <View style={[Styling.groups.themeComponent(this.isDarkMode), { margin: Styling.metrics.block.small }]}>
            <View style={[Styling.groups.flexRowSpbCentered, { marginBottom: Styling.metrics.block.small }]}>
              <Text
                style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.medium }]}>
                {t('stats.visited')}
              </Text>
              <Text
                style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.medium }]}>
                {this.state.visits.length}
              </Text>
            </View>
            <View style={[Styling.groups.flexRowSpbCentered, { marginBottom: Styling.metrics.block.small }]}>
              <Text
                style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.medium }]}>
                {t('stats.booked')}
              </Text>
              <Text
                style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.medium }]}>
                {this.state.visits.filter(v => v.bookmark).length}
              </Text>
            </View>
            <View style={[Styling.groups.flexRowSpbCentered]}>
              <Text
                style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.medium }]}>
                {t('stats.readLast')}
              </Text>
              <Text
                style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.medium }]}>
                {this.state.visits.filter(v => !v.new_posts).length}
              </Text>
            </View>
          </View>
        )}
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={[Styling.groups.themeComponent(this.isDarkMode)]}
          refreshControl={<RefreshControl refreshing={this.state.isFetching} onRefresh={() => this.getVisits()} />}>
          <View>
            {this.state.visits?.length > 0 &&
              this.state.visits.map(v => (
                <UserRowComponent
                  key={`${v.username}-${v.last_visited_at}`}
                  user={v}
                  borderLeftWidth={Styling.metrics.block.xsmall}
                  borderColor={v.bookmark ? Styling.colors.primary : 'transparent'}
                  extraText={`${v.new_posts}  |  ${formatDate(v.last_visited_at)}`}
                  isDarkMode={this.isDarkMode}
                  isPressable={false}
                />
              ))}
          </View>
        </ScrollView>
      </View>
    )
  }
}
