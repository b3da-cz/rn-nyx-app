import React, { Component } from 'react'
import { ActivityIndicator, View, ScrollView, Image, LayoutAnimation } from 'react-native'
import { Badge, Button, Dialog, FAB, Text, TextInput, IconButton, Menu, Divider } from 'react-native-paper'
import Bugfender from '@bugfender/rn-bugfender'
import { ButtonComponent, confirm, UserRowComponent } from '../component'
import { MainContext, createIssue, LayoutAnimConf, pickFileAndResizeJpegs, t, Nyx } from '../lib'

type Props = {
  nyx: Nyx
  isVisible: boolean
  params: { discussionId?: number; mailRecipient?: string; isGitIssue?: boolean }
  fabBackgroundColor?: string
  fabBottomPosition?: number
  fabTopPosition?: number
  fabIcon?: string
  onSend: Function
  onDismiss?: Function
}
type State = {
  areDetailsShown: boolean
  isDialogVisible: boolean
  isFetching: boolean
  isUploading: boolean
  isMenuVisible: boolean
  issueTitle: string
  selectedSize: string
  message: string
  msgBoxSelection: { start: number; end: number }
  uploadedFiles: any[]
  users: any[]
  searchPhrase: string
  selectedRecipient?: string
  lastTypingNotificationTs: number
}
export class MessageBoxDialog extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  refMsgBox: any
  sizes: any
  constructor(props) {
    super(props)
    this.state = {
      areDetailsShown: false,
      isDialogVisible: false,
      isFetching: false,
      isUploading: false,
      isMenuVisible: false,
      issueTitle: '',
      selectedSize: 'Original',
      message: '',
      msgBoxSelection: { start: 0, end: 0 },
      uploadedFiles: [],
      users: [],
      searchPhrase: '',
      selectedRecipient: undefined,
      lastTypingNotificationTs: 0,
    }
    this.refMsgBox = null
    this.sizes = [
      { title: 'Original', value: 'Original' },
      { title: null, value: null },
      { title: '1920px', value: 1920 },
      { title: '1366px', value: 1366 },
      { title: '900px', value: 900 },
      { title: '600px', value: 600 },
      { title: '400px', value: 400 },
    ]
  }

  showDialog(isFromFab = false) {
    this.setState({ isDialogVisible: true })
    if (this.props.params.mailRecipient?.length && !isFromFab) {
      this.setState({ selectedRecipient: this.props.params.mailRecipient, searchPhrase: '', users: [] })
    }
    this.fetchUploadedFiles()
    setTimeout(() => this.refMsgBox?.focus(), 100)
  }

  setMsgBoxCursorPosition(index, andFocus) {
    this.refMsgBox?.setNativeProps({
      selection: {
        start: index,
        end: index,
      },
    })
    if (andFocus) {
      this.refMsgBox?.focus()
    }
  }

  onMessageChange(val: string) {
    this.setState({ message: val })
    this.sendTypingNotification()
  }

  async sendTypingNotification() {
    const now = +new Date()
    if (this.state.selectedRecipient && now > this.state.lastTypingNotificationTs + 5000) {
      this.setState({ lastTypingNotificationTs: now })
      await this.props.nyx.api.sendTypingNotification(this.state.selectedRecipient)
    }
  }

  async fetchUploadedFiles() {
    this.setState({ isUploading: true })
    const res = await this.props.nyx.api.getWaitingFiles(this.props.params?.discussionId ?? 0)
    this.setState({ isUploading: false, uploadedFiles: res?.waiting_files || [] })
  }

  async searchUsername(searchPhrase) {
    this.setState({ isFetching: true, searchPhrase })
    const res = await this.props.nyx.api.search(searchPhrase, false, true)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    if (res?.exact) {
      this.setState({ isFetching: false, users: [...res.exact, ...(res.friends || []), ...(res.others || [])] })
    } else if (!searchPhrase || searchPhrase?.length === 0) {
      this.setState({ isFetching: false, users: [] })
    }
    // this.setState({ isFetching: false })
  }

  async selectRecipient(user) {
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ searchPhrase: user.username, selectedRecipient: user.username, users: [] })
  }

  selectSize = size => {
    this.setState({ selectedSize: size, isMenuVisible: false })
  }

  async appendFile() {
    if (this.state.isUploading) {
      return
    }
    try {
      const file = await pickFileAndResizeJpegs(this.state.selectedSize)
      if (!file) {
        return
      }
      this.setState({ isUploading: true })
      const res = await this.props.nyx.api.uploadFile(file, this.props.params?.discussionId)
      if (res?.id && res.id > 0) {
        LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
        this.setState({
          isUploading: false,
          uploadedFiles: this.state.uploadedFiles?.length ? [...this.state.uploadedFiles, res] : [res],
        })
        Bugfender.d('INFO', 'upload file ok')
      } else {
        Bugfender.w('WARNING', 'upload file not ok? ' + (res?.error ? res.error : ''))
      }
    } catch (e) {
      console.warn(e)
    }
  }

  async deleteFile(fileId) {
    const res = await confirm(t('confirm'), `${t('delete.attachment')}?`)
    if (!res) {
      return
    }
    this.setState({ isUploading: true })
    await this.props.nyx.api.deleteFile(fileId)
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ isUploading: false, uploadedFiles: this.state.uploadedFiles.filter(f => f.id !== fileId) })
  }

  toggleDetail(areDetailsShown) {
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ areDetailsShown })
  }

  addText(text, addNewline = false) {
    this.setState({
      message: `${this.state.message}${addNewline && this.state.message?.length > 0 ? '\n' : ''}${text}`,
    })
  }

  async sendMessage() {
    if (!(this.state.message.length || this.state.uploadedFiles.length)) {
      return
    }
    this.setState({ isFetching: true })
    let res
    if (this.props.params.discussionId && this.props.params.discussionId > 0) {
      res = await this.props.nyx.api.postToDiscussion(this.props.params.discussionId, this.state.message)
    } else if (this.state.selectedRecipient && this.state.selectedRecipient.length > 0) {
      res = await this.props.nyx.api.sendPrivateMessage(this.state.selectedRecipient, this.state.message)
    } else if (this.props.params.isGitIssue) {
      res = await createIssue(this.state.issueTitle, this.state.message)
      this.setState({ isFetching: false })
    }
    if (!res || res?.error) {
      console.warn(res)
      return
    }
    this.setState({ isFetching: false, message: '', uploadedFiles: [], isDialogVisible: false })
    this.props.onSend()
  }

  dismissDialog() {
    this.setState({ isDialogVisible: false })
    typeof this.props.onDismiss === 'function' && this.props.onDismiss()
  }

  render() {
    if (!this.context?.theme?.colors?.ripple) {
      return null // todo ios
    }
    const { isVisible, params } = this.props
    const {
      areDetailsShown,
      isDialogVisible,
      isFetching,
      isMenuVisible,
      isUploading,
      issueTitle,
      message,
      searchPhrase,
      selectedRecipient,
      selectedSize,
      uploadedFiles,
      users,
    } = this.state
    const {
      colors,
      metrics: { blocks, fontSizes },
    } = this.context.theme
    return (
      <View style={{ position: 'absolute', top: 0, height: '100%', left: 0, right: 0 }}>
        <Dialog
          visible={isDialogVisible}
          onDismiss={() => this.dismissDialog()}
          style={{ marginLeft: 5, marginRight: 5, marginTop: 5, zIndex: 1 }}>
          <Dialog.ScrollArea
            style={{
              paddingLeft: 5,
              paddingRight: 5,
              paddingTop: 5,
              paddingBottom: 0,
              maxHeight: isMenuVisible ? '69%' : '86%',
            }}>
            <ScrollView keyboardDismissMode={'on-drag'} keyboardShouldPersistTaps={'always'}>
              {!!params?.isGitIssue && (
                <TextInput
                  numberOfLines={1}
                  textAlignVertical={'center'}
                  selectionColor={colors.primary}
                  onChangeText={val => this.setState({ issueTitle: val })}
                  value={`${issueTitle}`}
                  placeholder={selectedRecipient || `${t('title')} ..`}
                  style={{
                    marginBottom: -2,
                    zIndex: 1,
                    height: 42,
                  }}
                />
              )}
              {!params?.discussionId && !params.isGitIssue && (
                <View>
                  <TextInput
                    numberOfLines={1}
                    textAlignVertical={'center'}
                    selectionColor={colors.primary}
                    onChangeText={val => this.searchUsername(val)}
                    value={`${searchPhrase}`}
                    placeholder={selectedRecipient || `${t('username')} ..`}
                    style={{
                      marginBottom: -2,
                      zIndex: 1,
                      height: 42,
                    }}
                  />
                  {users?.length > 0 &&
                    users.map(u => (
                      <UserRowComponent key={u.username} user={u} onPress={() => this.selectRecipient(u)} />
                    ))}
                </View>
              )}
              {users.length === 0 && (
                <TextInput
                  ref={r => (this.refMsgBox = r)}
                  multiline={true}
                  textAlignVertical={'top'}
                  // selection={msgBoxSelection}
                  // onSelectionChange={({ nativeEvent: { selection } }) => setMsgBoxSelection(selection)} // portal!! wtf
                  onChangeText={val => this.onMessageChange(val)}
                  value={`${message}`}
                  placeholder={`${t('message')} ..`}
                />
              )}
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions style={{ flexDirection: 'column', alignItems: 'stretch', paddingTop: 0, paddingBottom: 0 }}>
            {areDetailsShown && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: 5,
                }}>
                <View style={{ alignItems: 'center' }}>
                  <Text>{t('jpegSize')}</Text>
                  <Menu
                    visible={isMenuVisible}
                    statusBarHeight={-150}
                    onDismiss={() => this.setState({ isMenuVisible: false })}
                    anchor={
                      <Button
                        onPress={() => (isUploading ? null : this.setState({ isMenuVisible: true }))}
                        uppercase={false}
                        color={isUploading ? colors.disabled : colors.text}>
                        {`${selectedSize}${selectedSize !== 'Original' ? 'px' : ''}`}
                      </Button>
                    }>
                    {this.sizes.map((s, i) =>
                      !s.value ? (
                        <Divider key={`d${i}`} />
                      ) : (
                        <Menu.Item key={s.value} onPress={() => this.selectSize(s.value)} title={s.title} />
                      ),
                    )}
                  </Menu>
                </View>
                <View>
                  {uploadedFiles.map(f => (
                    <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image
                        style={{
                          width: 25,
                          height: 25,
                          marginRight: blocks.medium,
                        }}
                        resizeMode={'cover'}
                        source={{ uri: `https://nyx.cz${f.thumb_url}` }}
                      />
                      <ButtonComponent
                        icon={'trash-2'}
                        label={`${f.filename}  [${(f.size / 1024).toFixed(2)}kb]`}
                        textAlign={'left'}
                        backgroundColor={'transparent'}
                        fontSize={12}
                        lineHeight={22}
                        paddingHorizontal={0}
                        onPress={() => (isUploading ? null : this.deleteFile(f.id))}
                        color={isUploading ? colors.disabled : colors.text}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              {!params?.isGitIssue ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', height: 50 }}>
                  <IconButton
                    icon={'unfold-more-horizontal'}
                    onPress={() => this.toggleDetail(!areDetailsShown)}
                    rippleColor={colors.ripple}
                  />
                  {isUploading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginRight: 12 }} />
                  ) : (
                    <View>
                      {uploadedFiles.length > 0 && (
                        <Badge visible={true} style={{ position: 'absolute' }}>
                          {uploadedFiles.length}
                        </Badge>
                      )}
                      <IconButton icon={'file'} onPress={() => this.appendFile()} rippleColor={colors.ripple} />
                    </View>
                  )}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', height: 50 }}>
                  <Text style={{ fontSize: fontSizes.p }}>Github issue</Text>
                </View>
              )}
              <View style={{ height: '70%', width: 1, borderLeftWidth: 1, borderColor: colors.disabled }} />
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '50%' }}>
                <IconButton
                  icon={'link'}
                  size={17}
                  onPress={() => this.addText('<a href=""></a>', true)}
                  rippleColor={colors.ripple}
                />
                <IconButton
                  icon={'image'}
                  size={17}
                  onPress={() => this.addText('<img src="" title="" alt="">', true)}
                  rippleColor={colors.ripple}
                />
                <IconButton
                  icon={'lock'}
                  size={17}
                  onPress={() => this.addText('<div class="spoiler"></div>', true)}
                  rippleColor={colors.ripple}
                />
                {/*<IconButton*/}
                {/*  icon={'close'}*/}
                {/*  size={17}*/}
                {/*  color={'red'}*/}
                {/*  onPress={() => this.setState({ message: '' })}*/}
                {/*  rippleColor={colors.ripple}*/}
                {/*/>*/}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/*<IconButton icon={'backspace'} size={22} onPress={() => setMessage('')} />*/}
                {isFetching ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <IconButton
                    icon={'play'}
                    size={27}
                    color={colors.primary}
                    onPress={() => this.sendMessage()}
                    rippleColor={colors.ripple}
                  />
                )}
              </View>
            </View>
          </Dialog.Actions>
        </Dialog>
        <FAB
          small={this.props.params.isGitIssue}
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: this.props.fabTopPosition === undefined ? this.props.fabBottomPosition || 0 : undefined,
            top: this.props.fabTopPosition,
            backgroundColor: this.props.fabBackgroundColor || colors.primary,
          }}
          icon={this.props.fabIcon || 'message'}
          visible={isVisible && !isDialogVisible}
          onPress={() => this.showDialog(true)}
        />
      </View>
    )
  }
}
