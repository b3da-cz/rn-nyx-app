import React, { Component } from 'react'
import { Text, View, LayoutAnimation, FlatList } from 'react-native'
import { UserRowComponent } from '../component'
import { MainContext, formatDate, LayoutAnimConf, Styling, t } from '../lib'

type Props = {
  id: number,
}
export class DiscussionStatsComponent extends Component<Props> {
  static contextType = MainContext
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
        <FlatList
          data={this.state.visits}
          extraData={this.state}
          keyExtractor={(item, index) => `${item.username}-${item.last_visited_at}`}
          refreshing={this.state.isFetching}
          onRefresh={() => this.getVisits(true)}
          style={Styling.groups.themeComponent(this.isDarkMode)}
          getItemLayout={(data, index) => {
            return { length: 38, offset: 38 * index, index }
          }}
          initialNumToRender={30}
          renderItem={({ item }) => (
            <UserRowComponent
              key={`${item.username}-${item.last_visited_at}`}
              user={item}
              borderLeftWidth={Styling.metrics.block.xsmall}
              borderColor={item.bookmark ? Styling.colors.primary : 'transparent'}
              extraText={`${item.new_posts}  |  ${formatDate(item.last_visited_at)}`}
              isDarkMode={this.isDarkMode}
              isPressable={false}
            />
          )}
        />
      </View>
    )
  }
}
