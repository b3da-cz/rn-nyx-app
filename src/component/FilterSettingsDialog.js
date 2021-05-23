import React, { Component } from 'react'
import { LayoutAnimation, ScrollView, Text, View } from 'react-native'
import { Dialog, FAB, TextInput, IconButton } from 'react-native-paper'
import { UserRowComponent } from '../component'
import { LayoutAnimConf, MainContext, Styling, Storage, t } from '../lib'

type Props = {
  onUpdate: Function,
}
export class FilterSettingsDialog extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.state = {
      isDialogVisible: false,
      isDarkMode: false,
      isFetching: false,
      phrase: '',
      filters: [],
      usernameToFind: '',
      blockedUsers: [],
      users: [],
    }
  }

  componentDidMount() {
    this.init()
  }

  init() {
    this.nyx = this.context.nyx
    this.setState({ isDarkMode: this.context.theme === 'dark' })
  }

  showDialog() {
    this.setState({ isDialogVisible: true })
    this.loadStorage()
  }

  async loadStorage() {
    const filters = (await Storage.getFilters()) || []
    const blockedUsers = (await Storage.getBlockedUsers()) || []
    this.setState({ filters, blockedUsers })
  }

  async searchUsername(phrase) {
    this.setState({ isFetching: true, usernameToFind: phrase })
    const res = await this.nyx.search({ phrase, isUsername: true })
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    if (res?.exact) {
      this.setState({ isFetching: false, users: [...res.exact, ...(res.friends || []), ...(res.others || [])] })
    } else if (!phrase || phrase?.length === 0) {
      this.setState({ isFetching: false, users: [] })
    }
  }

  async blockUser(username) {
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({
      blockedUsers: Array.from(new Set([...this.state.blockedUsers, username])),
      users: [],
      usernameToFind: '',
    })
  }

  async unblockUser(username) {
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ blockedUsers: this.state.blockedUsers.filter(u => u !== username) })
  }

  async addFilter(phrase) {
    if (!phrase || phrase?.length === 0) {
      return
    }
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ filters: Array.from(new Set([...this.state.filters, phrase])), phrase: '' })
  }

  async removeFilter(phrase) {
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ filters: this.state.filters.filter(u => u !== phrase) })
  }

  onUpdate() {
    this.setState({ isDialogVisible: false })
    setTimeout(() => this.props.onUpdate({ filters: this.state.filters, blockedUsers: this.state.blockedUsers }), 300)
  }

  render() {
    const { isDialogVisible, isDarkMode, isFetching, phrase, users, blockedUsers, filters, usernameToFind } = this.state
    return (
      <View style={{ position: 'absolute', top: 0, height: '100%', left: 0, right: 0 }}>
        <Dialog
          visible={isDialogVisible}
          onDismiss={() => this.onUpdate()}
          style={{ marginLeft: 5, marginRight: 5, marginTop: 5, zIndex: 1 }}>
          <Dialog.ScrollArea style={{ paddingLeft: 5, paddingRight: 5, paddingTop: 5, paddingBottom: 0 }}>
            <ScrollView keyboardDismissMode={'on-drag'} keyboardShouldPersistTaps={'always'}>
              <View>
                <View style={Styling.groups.flexRowSpbCentered}>
                  <TextInput
                    numberOfLines={1}
                    textAlignVertical={'center'}
                    selectionColor={Styling.colors.primary}
                    onChangeText={val => this.setState({ phrase: val })}
                    value={`${phrase}`}
                    placeholder={`${t('filter.title')} ..`}
                    style={{
                      backgroundColor: isDarkMode ? Styling.colors.dark : Styling.colors.light,
                      marginBottom: 3,
                      height: 42,
                      width: '85%',
                    }}
                  />
                  <IconButton
                    icon={'play'}
                    onPress={() => this.addFilter(phrase)}
                    rippleColor={'rgba(18,146,180, 0.3)'}
                  />
                </View>
                <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker, marginBottom: 5 }}>
                  {t('filter.phrases')} {filters?.length === 0 && `[${t('empty')}]`}
                </Text>
                {filters?.length > 0 &&
                  filters.map((f, i) => (
                    <UserRowComponent
                      key={`${f}-${i}`}
                      user={{ username: f }}
                      withIcon={false}
                      isDarkMode={isDarkMode}
                      onPress={() => this.removeFilter(f)}
                    />
                  ))}
              </View>
              <View>
                <TextInput
                  numberOfLines={1}
                  textAlignVertical={'center'}
                  selectionColor={Styling.colors.primary}
                  onChangeText={val => this.searchUsername(val)}
                  value={`${usernameToFind}`}
                  placeholder={`${t('username')} ..`}
                  style={{
                    backgroundColor: isDarkMode ? Styling.colors.dark : Styling.colors.light,
                    marginBottom: 3,
                    height: 42,
                  }}
                />
                <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker, marginBottom: 5 }}>
                  {t('filter.users')} {blockedUsers?.length === 0 && `[${t('empty')}]`}
                </Text>
                {users?.length > 0 &&
                  users.map(u => (
                    <UserRowComponent
                      key={u.username}
                      user={u}
                      isDarkMode={isDarkMode}
                      onPress={() => this.blockUser(u.username)}
                    />
                  ))}
                {blockedUsers?.length > 0 &&
                  blockedUsers.map(u => (
                    <UserRowComponent
                      key={u}
                      user={{ username: u }}
                      isDarkMode={isDarkMode}
                      onPress={() => this.unblockUser(u)}
                    />
                  ))}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
        <FAB
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 0,
            backgroundColor: Styling.colors.medium,
          }}
          icon={'filter'}
          visible={!isDialogVisible}
          onPress={() => this.showDialog()}
        />
      </View>
    )
  }
}
