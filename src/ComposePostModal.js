import React, { Component } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, Modal, View } from 'react-native'
import DocumentPicker from 'react-native-document-picker'
import Icon from 'react-native-vector-icons/Feather'
import { confirm, Nyx, Styling } from './'

type Props = {
  isDarkMode: boolean,
  nyx: Nyx,
  title: string,
  uploadedFiles: Array,
  activeDiscussionId: number,
  onSend: Function,
}
export class ComposePostModal extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      isModalVisible: false,
      message: '',
      files: [],
    }
  }

  showModal(isModalVisible) {
    this.setState({ isModalVisible })
  }

  async pickFile() {
    try {
      const file = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
      })
      this.setState({ isFetching: true })
      const res = await this.nyx.uploadFile(this.props.activeDiscussionId, {
        uri: file.uri,
        type: file.type,
        name: file.name,
      })
      if (res && res.id > 0) {
        this.setState({
          isFetching: false,
          files: [...this.state.files, res],
        })
      }
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) {
        console.warn(e)
      }
    }
  }

  async deleteFile(fileId) {
    const res = await confirm('Warning', 'Delete attachment?')
    if (!res) {
      return
    }
    this.setState({ isFetching: true })
    await this.props.nyx.deleteFile(fileId)
    this.setState({
      isFetching: false,
      files: this.state.files.filter(f => f.id !== fileId),
    })
  }

  async sendPost() {
    if (!this.state.message || (this.state.message && this.state.message.length === 0)) {
      return
    }
    this.setState({ isFetching: true })
    const res = await this.props.nyx.postToDiscussion(this.props.activeDiscussionId, this.state.message)
    if (res.error) {
      console.warn(res)
      return
    }
    this.props.onSend()
    this.setState({ isFetching: false, isModalVisible: false, message: '', files: [] })
  }

  render() {
    const files =
      this.state.files && this.state.files.length > 0
        ? this.state.files
        : this.props.uploadedFiles && this.props.uploadedFiles.length > 0
        ? this.props.uploadedFiles
        : []
    return (
      <Modal
        visible={this.state.isModalVisible}
        transparent={false}
        animationType={'slide'}
        onRequestClose={() => this.showModal(false)}>
        <View style={[Styling.groups.themeView(this.props.isDarkMode), { width: '100%', height: '100%' }]}>
          <Text
            style={[
              Styling.groups.themeComponent(this.props.isDarkMode),
              { width: '100%', fontSize: 24, lineHeight: 60 },
            ]}>
            Post to {this.props.title}
          </Text>
          <View style={{ flex: 1 }}>
            <TextInput
              multiline={true}
              numberOfLines={15}
              textAlignVertical={'top'}
              onChangeText={val => this.setState({ message: val })}
              value={`${this.state.message}`}
              placeholder={'message ...'}
              style={{ backgroundColor: Styling.colors.dark }}
            />
          </View>
          <View>
            {this.state.isFetching && (
              <ActivityIndicator size="large" color={Styling.colors.primary} style={{ marginBottom: 200 }} />
            )}
            {files.length > 0 &&
              files.map(f => (
                <TouchableOpacity
                  style={[
                    Styling.groups.themeComponent(this.props.isDarkMode),
                    { width: '100%', fontSize: 24, lineHeight: 60 },
                  ]}
                  accessibilityRole="button"
                  onPress={() => this.deleteFile(f.id)}>
                  <Text
                    style={{
                      color: this.props.isDarkMode ? Styling.colors.light : Styling.colors.dark,
                      fontSize: 16,
                      lineHeight: 60,
                      paddingHorizontal: 5,
                    }}>
                    <Icon name="trash-2" size={24} color="#ccc" />
                    {` ${f.filename}`}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
          <TouchableOpacity
            style={[
              Styling.groups.themeComponent(this.props.isDarkMode),
              { width: '100%', fontSize: 24, lineHeight: 60 },
            ]}
            accessibilityRole="button"
            onPress={() => this.pickFile()}>
            <Text
              style={{
                color: Styling.colors.primary,
                fontSize: 24,
                lineHeight: 60,
                paddingHorizontal: 5,
                textAlign: 'center',
              }}>
              <Icon name="image" size={24} color="#ccc" />
              {` Append file ${files.length > 0 ? `[${files.length}]` : ''}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              Styling.groups.themeComponent(this.props.isDarkMode),
              { width: '100%', fontSize: 24, lineHeight: 60 },
            ]}
            accessibilityRole="button"
            onPress={() => this.sendPost()}>
            <Text
              style={{
                color: Styling.colors.primary,
                fontSize: 24,
                lineHeight: 60,
                paddingHorizontal: 5,
                textAlign: 'center',
              }}>
              <Icon name="send" size={24} color="#ccc" />
              {' Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    )
  }
}
