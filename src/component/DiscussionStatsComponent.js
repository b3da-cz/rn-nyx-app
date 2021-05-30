import React, { Component } from 'react'
import { View, LayoutAnimation, FlatList } from 'react-native'
import { Text } from 'react-native-paper'
import { UserRowComponent } from '../component'
import { MainContext, formatDate, LayoutAnimConf, Styling, t, ThemeAware } from '../lib'

type Props = {
  id: number,
}
export class DiscussionStatsComponent extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.state = {
      visits: [],
      theme: null,
      isFetching: false,
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.getVisits(true)
  }

  async getVisits(isAnimated = false) {
    this.setState({ isFetching: true })
    const res = await this.nyx.getDiscussionStats(this.props.id)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ visits: res.visits, isFetching: false })
  }

  render() {
    if (!this.state.theme) {
      return <ThemeAware setTheme={theme => this.setState({ theme })} />
    }
    const {
      colors,
      metrics: { blocks, fontSizes },
    } = this.state.theme
    return (
      <View style={{ height: '100%' }}>
        {this.state.visits?.length > 0 && (
          <View style={[{ margin: blocks.medium }]}>
            <View style={[Styling.groups.flexRowSpbCentered, { marginBottom: blocks.medium }]}>
              <Text style={{ fontSize: fontSizes.p }}>{t('stats.visited')}</Text>
              <Text style={{ fontSize: fontSizes.p }}>{this.state.visits.length}</Text>
            </View>
            <View style={[Styling.groups.flexRowSpbCentered, { marginBottom: blocks.medium }]}>
              <Text style={{ fontSize: fontSizes.p }}>{t('stats.booked')}</Text>
              <Text style={{ fontSize: fontSizes.p }}>{this.state.visits.filter(v => v.bookmark).length}</Text>
            </View>
            <View style={[Styling.groups.flexRowSpbCentered]}>
              <Text style={{ fontSize: fontSizes.p }}>{t('stats.readLast')}</Text>
              <Text style={{ fontSize: fontSizes.p }}>{this.state.visits.filter(v => !v.new_posts).length}</Text>
            </View>
          </View>
        )}
        <FlatList
          data={this.state.visits}
          extraData={this.state}
          keyExtractor={(item, index) => `${item.username}-${item.last_visited_at}`}
          refreshing={this.state.isFetching}
          onRefresh={() => this.getVisits(true)}
          getItemLayout={(data, index) => {
            return { length: 38, offset: 38 * index, index }
          }}
          initialNumToRender={30}
          renderItem={({ item }) => (
            <UserRowComponent
              key={`${item.username}-${item.last_visited_at}`}
              user={item}
              borderLeftWidth={blocks.small}
              borderColor={item.bookmark ? colors.primary : 'transparent'}
              extraText={`${item.new_posts}  |  ${formatDate(item.last_visited_at)}`}
              isPressable={false}
            />
          )}
        />
      </View>
    )
  }
}
