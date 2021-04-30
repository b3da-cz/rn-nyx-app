import React, { Component } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, FlatList, View } from 'react-native'
import { TextInput, TouchableRipple } from 'react-native-paper'
import DocumentPicker from 'react-native-document-picker'
import ImageResizer from 'react-native-image-resizer'
import { Picker } from '@react-native-picker/picker'
import { ButtonComponent, confirm, UserRowComponent } from '../component'
import { Context, Styling } from '../lib'
import Bugfender from '@bugfender/rn-bugfender'

type Props = {
  title: string,
  isMailPost: boolean,
  uploadedFiles: Array,
  discussionId?: number,
  postId?: number,
  replyTo?: string,
  username?: string,
  onSend: Function,
}
export class ComposePostView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      message: '',
      searchPhrase: '',
      searchResults: [],
      username: '',
      files: [],
      jpegSize: 1920,
    }
    this.isDarkMode = true
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.prepareForm()
  }

  prepareForm() {
    const { username, uploadedFiles } = this.props
    const message =
      this.props.postId && this.props.replyTo ? `{reply ${this.props.replyTo}|${this.props.postId}}: ` : ''
    this.setState({ username, uploadedFiles, message })
  }

  async searchUsername(searchPhrase) {
    this.setState({ searchPhrase, isFetching: true })
    const res = await this.nyx.search({ phrase: searchPhrase, isUsername: true })
    // console.warn(res) // TODO: remove
    if (res && res.exact) {
      const searchResults = [...res.exact, ...res.friends, ...res.others]
      // console.warn(searchResults) // TODO: remove
      this.setState({ isFetching: false, searchResults })
    } else {
      this.setState({ isFetching: false })
    }
  }

  async pickFile() {
    try {
      const file = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
      })
      this.setState({ isFetching: true })
      // console.warn(`original ${Math.floor(file.size / 1024)}Kb`) // TODO: remove
      let resized = null
      if (file.type === 'image/jpeg') {
        resized = await ImageResizer.createResizedImage(
          file.uri,
          this.state.jpegSize,
          this.state.jpegSize,
          'JPEG',
          80,
          undefined,
          undefined,
          false,
          {
            onlyScaleDown: true,
          },
        )
        // console.warn(`resized ${Math.floor(resized.size / 1024)}Kb`) // TODO: remove
      }
      const res = await this.nyx.uploadFile(
        {
          uri: resized ? resized.uri : file.uri,
          type: file.type,
          name: file.name,
        },
        this.props.isMailPost ? null : this.props.discussionId,
      )
      if (res && res.id > 0) {
        this.setState({
          isFetching: false,
          uploadedFiles: [...this.state.uploadedFiles, res],
        })
      }
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) {
        console.warn(e)
        Bugfender.e('ERROR_COMPOSE_APPEND', e.message + ' | ' + e.stack)
      }
    }
  }

  async deleteFile(fileId) {
    const res = await confirm('Warning', 'Delete attachment?')
    if (!res) {
      return
    }
    this.setState({ isFetching: true })
    await this.nyx.deleteFile(fileId)
    this.setState({
      isFetching: false,
      uploadedFiles: this.state.uploadedFiles.filter(f => f.id !== fileId),
    })
  }

  async sendPost() {
    if (!this.state.message || (this.state.message && this.state.message.length === 0)) {
      return
    }
    this.setState({ isFetching: true })
    let res
    if (this.props.isMailPost) {
      res = await this.nyx.sendPrivateMessage(this.state.username, this.state.message)
    } else {
      res = await this.nyx.postToDiscussion(this.props.discussionId, this.state.message)
    }
    if (res.error) {
      console.warn(res)
      return
    }
    this.setState({ isFetching: false, message: '', files: [] })
    this.props.onSend()
  }

  render() {
    const { uploadedFiles, searchPhrase, searchResults, message, username } = this.state
    return (
      <View style={[Styling.groups.themeView(this.isDarkMode), { width: '100%', height: '100%' }]}>
        {!this.props.isMailPost && (
          <Text
            numberOfLines={1}
            style={[
              Styling.groups.themeView(this.isDarkMode),
              { width: '100%', fontSize: 24, lineHeight: 60, paddingHorizontal: Styling.metrics.block.small },
            ]}>
            {this.props.title}
          </Text>
        )}
        <View style={{ flex: 1 }}>
          {this.props.isMailPost ? (
            <View>
              <TextInput
                numberOfLines={1}
                textAlignVertical={'center'}
                selectionColor={Styling.colors.primary}
                onChangeText={val => this.searchUsername(val)}
                value={`${searchPhrase}`}
                placeholder={username || 'username ..'}
                style={{ backgroundColor: Styling.colors.dark, marginHorizontal: Styling.metrics.block.small }}
              />
              <FlatList
                data={searchResults}
                extraData={this.state}
                keyExtractor={(item, index) => `${item.username}`}
                refreshing={this.state.isFetching}
                style={{
                  // height: '100%',
                  paddingTop: Styling.metrics.block.small,
                  backgroundColor: this.isDarkMode ? Styling.colors.black : Styling.colors.lighter,
                }}
                renderItem={({ item }) => (
                  <UserRowComponent
                    key={item.username}
                    user={item}
                    isDarkMode={this.isDarkMode}
                    onPress={() =>
                      this.setState({ username: item.username, searchPhrase: item.username, searchResults: [] })
                    }
                  />
                )}
              />
            </View>
          ) : null}
          {searchResults.length === 0 && (
            <TextInput
              multiline={true}
              numberOfLines={15}
              textAlignVertical={'top'}
              selectionColor={Styling.colors.primary}
              onChangeText={val => this.setState({ message: val })}
              value={`${message}`}
              placeholder={'message ...'}
              style={{ backgroundColor: Styling.colors.dark, marginHorizontal: Styling.metrics.block.small }}
            />
          )}
          <Picker
            mode={'dropdown'}
            style={[Styling.groups.themeComponent(this.isDarkMode), { color: Styling.colors.primary }]}
            prompt={'Recipient'}
            selectedValue={this.state.jpegSize}
            onValueChange={size => this.setState({ jpegSize: size })}>
            <Picker.Item key={'original'} label={'Original'} value={20000} color={Styling.colors.primary} />
            <Picker.Item key={'1920x'} label={'1920x'} value={1920} color={Styling.colors.primary} />
            <Picker.Item key={'1366x'} label={'1366x'} value={1366} color={Styling.colors.primary} />
            <Picker.Item key={'900x'} label={'900x'} value={900} color={Styling.colors.primary} />
            <Picker.Item key={'600x'} label={'600x'} value={600} color={Styling.colors.primary} />
            <Picker.Item key={'600x'} label={'400x'} value={400} color={Styling.colors.primary} />
          </Picker>
        </View>
        {searchResults.length === 0 && (
          <View>
            <View>
              {this.state.isFetching && (
                <ActivityIndicator size="large" color={Styling.colors.primary} style={{ marginBottom: 200 }} />
              )}
              {uploadedFiles?.length > 0 &&
                uploadedFiles.map(f => (
                  <ButtonComponent
                    key={f.id}
                    label={f.filename}
                    icon={'trash-2'}
                    textAlign={'left'}
                    color={Styling.colors.secondary}
                    fontSize={Styling.metrics.fontSize.medium}
                    marginBottom={Styling.metrics.block.small}
                    isDarkMode={this.isDarkMode}
                    onPress={() => this.deleteFile(f.id)}
                  />
                ))}
            </View>
            <View>
              <ButtonComponent
                label={`Append file ${uploadedFiles?.length > 0 ? `[${uploadedFiles?.length}]` : ''}`}
                icon={'image'}
                isDarkMode={this.isDarkMode}
                onPress={() => this.pickFile()}
              />
              <ButtonComponent
                label={'Send'}
                icon={'send'}
                isDarkMode={this.isDarkMode}
                onPress={() => this.sendPost()}
              />
            </View>
          </View>
        )}
      </View>
    )
  }
}
