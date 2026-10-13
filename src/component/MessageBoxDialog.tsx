import React, { Component } from 'react'
import {
  ActivityIndicator,
  View,
  ScrollView,
  Image,
  LayoutAnimation,
  Keyboard,
  Dimensions,
  StyleSheet,
  Modal,
} from 'react-native'
import { Badge, Button, Dialog, FAB, Text, TextInput, IconButton, Menu, Divider } from 'react-native-paper'
import { Bugfender } from '@bugfender/rn-bugfender'
import { ButtonComponent, confirm, SafeBottom, UserRowComponent } from '../component'
import ImageResizer from '@bam.tech/react-native-image-resizer'
import {
  MainContext,
  createIssue,
  LayoutAnimConf,
  JPEG_QUALITY_DEFAULT,
  JPEG_QUALITY_PERCENTS,
  pickFileAndResizeJpegs,
  isVideoUpload,
  videoTagFromUpload,
  isResizableImageUpload,
  jpegUploadName,
  clampJpegQuality,
  t,
  Nyx,
  Storage,
  asFileUri,
  keyboardLift,
} from '../lib'

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
  isQualityMenuVisible: boolean
  issueTitle: string
  selectedSize: string
  selectedQuality: number
  message: string
  msgBoxSelection: { start: number; end: number }
  uploadedFiles: any[]
  users: any[]
  searchPhrase: string
  selectedRecipient?: string
  lastTypingNotificationTs: number
  keyboardHeight: number
  keyboardVisible: boolean
}
export class MessageBoxDialog extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  refMsgBox: any
  refScroll: any
  sizes: any
  keyboardShowSub?: { remove: () => void }
  keyboardHideSub?: { remove: () => void }
  dimensionsSub?: { remove: () => void }
  overlayRef: any
  kbTimers: Array<ReturnType<typeof setTimeout>>
  alive = true
  openedFocus = false
  _isUploadingCustomFile = false
  constructor(props) {
    super(props)
    this.state = {
      areDetailsShown: false,
      isDialogVisible: false,
      isFetching: false,
      isUploading: false,
      isMenuVisible: false,
      isQualityMenuVisible: false,
      issueTitle: '',
      selectedSize: 'Original',
      selectedQuality: JPEG_QUALITY_DEFAULT,
      message: '',
      msgBoxSelection: { start: 0, end: 0 },
      uploadedFiles: [],
      users: [],
      searchPhrase: '',
      selectedRecipient: undefined,
      lastTypingNotificationTs: 0,
      keyboardHeight: 0,
      keyboardVisible: false,
    }
    this.refMsgBox = null
    this.refScroll = null
    this.overlayRef = null
    this.kbTimers = []
    this.sizes = [
      { title: 'Original', value: 'Original' },
      { title: null, value: null },
      { title: '1920px', value: 1920 },
      { title: '1366px', value: 1366 },
      { title: '900px', value: 900 },
      { title: '600px', value: 600 },
      { title: '400px', value: 400 },
      { title: '320px', value: 320 },
      { title: '240px', value: 240 },
    ]
  }

  componentDidMount() {
    this.keyboardShowSub = Keyboard.addListener('keyboardDidShow', e => {
      this.kbEvent = e
      this.scheduleKeyboardSync()
    })
    this.keyboardHideSub = Keyboard.addListener('keyboardDidHide', () => {
      this.kbEvent = null
      this.clearKeyboardSync()
      if (this.state.keyboardHeight !== 0 || this.state.keyboardVisible) {
        this.setState({ keyboardHeight: 0, keyboardVisible: false })
      }
    })
    this.dimensionsSub = Dimensions.addEventListener('change', () => {
      if (this.kbEvent) {
        this.scheduleKeyboardSync()
      }
    })
    this.loadUploadSettings()
  }

  kbEvent: any = null

  clearKeyboardSync() {
    this.kbTimers.forEach(clearTimeout)
    this.kbTimers = []
  }

  scheduleKeyboardSync() {
    this.clearKeyboardSync()
    if (!this.state.isDialogVisible) {
      return
    }
    this.syncKeyboardInset()
    // The first Android event often arrives before the visible frame settles.
    // Rotation fixes it because the next event is measured after layout.
    this.kbTimers = [50, 200, 500].map(ms => setTimeout(() => this.syncKeyboardInset(), ms))
  }

  syncKeyboardInset = () => {
    if (!this.alive) {
      return
    }
    const metrics = this.kbEvent?.endCoordinates || (Keyboard.isVisible() ? Keyboard.metrics() : null)
    if (!metrics || !this.state.isDialogVisible) {
      return
    }
    const apply = (inset: number) => {
      if (!this.alive) {
        return
      }
      if (inset !== this.state.keyboardHeight || !this.state.keyboardVisible) {
        this.setState({ keyboardHeight: inset, keyboardVisible: true })
      }
    }
    const windowHeight = Dimensions.get('window').height
    const screenHeight = Dimensions.get('screen').height
    const node = this.overlayRef
    if (!node?.measureInWindow) {
      apply(keyboardLift({ containerY: 0, containerHeight: windowHeight, windowHeight, screenHeight, frame: metrics }))
      return
    }
    node.measureInWindow((_x: number, y: number, _w: number, height: number) => {
      if (!height) {
        return
      }
      apply(
        keyboardLift({
          containerY: y,
          containerHeight: height,
          windowHeight,
          screenHeight,
          frame: metrics,
        }),
      )
    })
  }

  async loadUploadSettings() {
    try {
      const settings = await Storage.getUploadSettings()
      if (settings) {
        this.setState({
          selectedSize: settings.size !== undefined ? settings.size : this.state.selectedSize,
          selectedQuality: settings.quality !== undefined ? settings.quality : this.state.selectedQuality,
        })
      }
    } catch (_) {}
  }

  componentWillUnmount() {
    this.alive = false
    this.clearKeyboardSync()
    this.keyboardShowSub?.remove()
    this.keyboardHideSub?.remove()
    this.dimensionsSub?.remove()
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.isDialogVisible && !prevState.isDialogVisible && (this.kbEvent || Keyboard.isVisible())) {
      if (!this.kbEvent && Keyboard.metrics()) {
        this.kbEvent = { endCoordinates: Keyboard.metrics() }
      }
      this.scheduleKeyboardSync()
    }
  }

  showDialog(isFromFab = false) {
    this.openedFocus = false
    this.setState({ isDialogVisible: true })
    if (this.props.params.mailRecipient?.length && !isFromFab) {
      this.setState({ selectedRecipient: this.props.params.mailRecipient, searchPhrase: '', users: [] })
    }
    this.loadUploadSettings()
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
    try {
      const res = await this.props.nyx.api.getWaitingFiles(this.props.params?.discussionId ?? 0)
      if (res?.waiting_files) {
        this.setState(prev => {
          const existingIds = new Set((res.waiting_files || []).map((f: any) => f.id))
          const justUploaded = (prev.uploadedFiles || []).filter((f: any) => !existingIds.has(f.id))
          return {
            uploadedFiles: [...res.waiting_files, ...justUploaded],
          }
        })
      }
    } catch (e) {
      console.warn('[MessageBoxDialog] fetchUploadedFiles error:', e)
    }
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
    this.setState({ selectedSize: size, isMenuVisible: false, isQualityMenuVisible: false })
    Storage.setUploadSettings({ size, quality: this.state.selectedQuality })
  }

  selectQuality = quality => {
    this.setState({ selectedQuality: quality, isQualityMenuVisible: false, isMenuVisible: false })
    Storage.setUploadSettings({ size: this.state.selectedSize, quality })
  }

  async appendFile() {
    if (this.state.isUploading) {
      return
    }
    try {
      const file = await pickFileAndResizeJpegs(this.state.selectedSize, this.state.selectedQuality)
      if (!file) {
        return
      }
      this.setState({ isUploading: true })
      const res = await this.props.nyx.api.uploadFile(file, this.props.params?.discussionId)
      if (res?.id && res.id > 0) {
        LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
        this.setState(prev => {
          const uploaded = {
            ...res,
            size: file.size != null ? file.size : res.size,
          }
          const next: Partial<State> = {
            isUploading: false,
            uploadedFiles: prev.uploadedFiles?.length ? [...prev.uploadedFiles, uploaded] : [uploaded],
          }
          if (isVideoUpload(uploaded)) {
            const tag = videoTagFromUpload(uploaded)
            if (tag) {
              next.message = `${prev.message}${prev.message?.length > 0 ? '\n' : ''}${tag}`
            }
          }
          return next
        })
        Bugfender.log('INFO', 'upload file ok')
      } else {
        this.setState({ isUploading: false })
        Bugfender.warn('WARNING', 'upload file not ok? ' + (res?.error ? res.error : ''))
      }
    } catch (e) {
      this.setState({ isUploading: false })
      console.warn(e)
    }
  }

  async uploadCustomFile(file: { uri: string; type: string; name: string; size?: number }) {
    if (!file?.uri || this._isUploadingCustomFile) {
      return
    }
    this._isUploadingCustomFile = true
    this.setState({ isUploading: true })
    try {
      let size = this.state.selectedSize
      let quality = this.state.selectedQuality
      try {
        const saved = await Storage.getUploadSettings()
        if (saved) {
          if (saved.size !== undefined) size = saved.size
          if (saved.quality !== undefined) quality = saved.quality
          this.setState({ selectedSize: size, selectedQuality: quality })
        }
      } catch (_) {}
      let targetFile: any = { ...file }
      if (!targetFile.type || targetFile.type === '*/*') {
        const lowerName = (targetFile.name || '').toLowerCase()
        if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) targetFile.type = 'image/jpeg'
        else if (lowerName.endsWith('.png')) targetFile.type = 'image/png'
        else if (lowerName.endsWith('.gif')) targetFile.type = 'image/gif'
        else if (lowerName.endsWith('.webp')) targetFile.type = 'image/webp'
        else if (lowerName.endsWith('.mp4')) targetFile.type = 'video/mp4'
      }
      if (isResizableImageUpload(targetFile) && size !== 'Original') {
        const dim = Number(size)
        if (Number.isFinite(dim) && dim > 0) {
          try {
            const resized = await ImageResizer.createResizedImage(
              targetFile.uri,
              dim,
              dim,
              'JPEG',
              clampJpegQuality(quality),
              0,
              undefined,
              false,
              { onlyScaleDown: true },
            )
            if (resized) {
              targetFile = {
                uri: asFileUri(resized.uri, resized.path),
                type: 'image/jpeg',
                name: jpegUploadName(targetFile.name),
                size: resized.size != null ? resized.size : targetFile.size,
              }
            }
          } catch (resizeErr) {
            console.warn('[MessageBoxDialog] Resize error, using original:', resizeErr)
          }
        }
      }
      const discId = this.props.params?.discussionId
      const res = await this.props.nyx.api.uploadFile(targetFile, discId)
      if (res?.id && res.id > 0) {
        LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
        const uploaded = {
          ...res,
          size: targetFile.size != null ? targetFile.size : res.size,
        }
        this.setState(prev => {
          const next: Partial<State> = {
            isUploading: false,
            uploadedFiles: prev.uploadedFiles?.some(f => f.id === uploaded.id)
              ? prev.uploadedFiles
              : [...(prev.uploadedFiles || []), uploaded],
          }
          if (isVideoUpload(uploaded)) {
            const tag = videoTagFromUpload(uploaded)
            if (tag) {
              next.message = `${prev.message}${prev.message?.length > 0 ? '\n' : ''}${tag}`
            }
          }
          return next
        })
        Bugfender.log('INFO', 'upload shared file ok')
        await this.fetchUploadedFiles()
      } else {
        this.setState({ isUploading: false })
        Bugfender.warn('WARNING', 'upload shared file not ok? ' + (res?.error ? res.error : ''))
      }
    } catch (e) {
      this.setState({ isUploading: false })
      console.warn(e)
    } finally {
      this._isUploadingCustomFile = false
      this.setState({ isUploading: false })
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
    this.clearKeyboardSync()
    this.setState({
      isFetching: false,
      message: '',
      uploadedFiles: [],
      isDialogVisible: false,
      keyboardVisible: false,
      keyboardHeight: 0,
    })
    this.props.onSend()
  }

  dismissDialog() {
    this.clearKeyboardSync()
    this.setState({ isDialogVisible: false, keyboardVisible: false, keyboardHeight: 0 })
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
      isQualityMenuVisible,
      isUploading,
      issueTitle,
      message,
      searchPhrase,
      selectedRecipient,
      selectedSize,
      selectedQuality,
      uploadedFiles,
      users,
      keyboardHeight,
      keyboardVisible,
    } = this.state
    const {
      colors,
      metrics: { blocks, fontSizes },
    } = this.context.theme
    const windowHeight = Dimensions.get('window').height
    const isAnyMenuVisible = isMenuVisible || isQualityMenuVisible
    const dialogMaxHeight = keyboardVisible
      ? Math.max(160, windowHeight - Math.max(0, keyboardHeight) - 16)
      : isAnyMenuVisible
      ? windowHeight * 0.69
      : windowHeight * 0.86
    const dialog = (
        <Dialog
          visible={isDialogVisible}
          onDismiss={() => this.dismissDialog()}
          style={
            keyboardVisible
              ? {
                  position: 'absolute',
                  left: 5,
                  right: 5,
                  bottom: keyboardHeight,
                  marginTop: 0,
                  marginBottom: 0,
                  marginHorizontal: 0,
                  maxHeight: dialogMaxHeight,
                  zIndex: 1,
                }
              : { marginLeft: 5, marginRight: 5, marginTop: 5, zIndex: 1 }
          }
        >
          <Dialog.ScrollArea
            style={{
              paddingLeft: 5,
              paddingRight: 5,
              paddingTop: 5,
              paddingBottom: 0,
              maxHeight: keyboardVisible ? dialogMaxHeight - 56 : isAnyMenuVisible ? '69%' : '86%',
            }}
          >
            <ScrollView
              ref={r => (this.refScroll = r)}
              keyboardDismissMode={'on-drag'}
              keyboardShouldPersistTaps={'always'}
              automaticallyAdjustKeyboardInsets={false}
              onContentSizeChange={() => {
                if (keyboardVisible) {
                  this.refScroll?.scrollToEnd({ animated: false })
                }
              }}
            >
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
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text>{t('jpegSize')}</Text>
                  <Menu
                    visible={isMenuVisible}
                    statusBarHeight={-150}
                    onDismiss={() => this.setState({ isMenuVisible: false })}
                    anchor={
                      <Button
                        onPress={() =>
                          isUploading ? null : this.setState({ isMenuVisible: true, isQualityMenuVisible: false })
                        }
                        uppercase={false}
                        color={isUploading ? colors.disabled : colors.text}
                      >
                        {`${selectedSize}${selectedSize !== 'Original' ? 'px' : ''}`}
                      </Button>
                    }
                  >
                    {this.sizes.map((s, i) =>
                      !s.value ? (
                        <Divider key={`d${i}`} />
                      ) : (
                        <Menu.Item key={s.value} onPress={() => this.selectSize(s.value)} title={s.title} />
                      ),
                    )}
                  </Menu>
                  <Text>{t('jpegQuality')}</Text>
                  <Menu
                    visible={isQualityMenuVisible}
                    statusBarHeight={-150}
                    onDismiss={() => this.setState({ isQualityMenuVisible: false })}
                    anchor={
                      <Button
                        onPress={() =>
                          isUploading ? null : this.setState({ isQualityMenuVisible: true, isMenuVisible: false })
                        }
                        uppercase={false}
                        color={isUploading ? colors.disabled : colors.text}
                      >
                        {`${selectedQuality}%`}
                      </Button>
                    }
                  >
                    {JPEG_QUALITY_PERCENTS.map(q => (
                      <Menu.Item key={q} onPress={() => this.selectQuality(q)} title={`${q}%`} />
                    ))}
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
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            >
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
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  flexWrap: 'nowrap',
                }}
              >
                <IconButton
                  icon={'link'}
                  size={18}
                  style={{ margin: 0 }}
                  onPress={() => this.addText('<a href=""></a>', true)}
                  rippleColor={colors.ripple}
                />
                <IconButton
                  icon={'image'}
                  size={18}
                  style={{ margin: 0 }}
                  onPress={() => this.addText('<img src="" title="" alt="">', true)}
                  rippleColor={colors.ripple}
                />
                <IconButton
                  icon={'lock'}
                  size={18}
                  style={{ margin: 0 }}
                  onPress={() => this.addText('<div class="spoiler"></div>', true)}
                  rippleColor={colors.ripple}
                />
                <IconButton
                  icon={'format-bold'}
                  size={18}
                  style={{ margin: 0 }}
                  onPress={() => this.addText('<b></b>', true)}
                  rippleColor={colors.ripple}
                />
                <IconButton
                  icon={'format-italic'}
                  size={18}
                  style={{ margin: 0 }}
                  onPress={() => this.addText('<i></i>', true)}
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
    )
    return (
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          height: 100,
          right: 0,
        }}
        pointerEvents="box-none"
      >
        {isDialogVisible && (
          <Modal
            visible
            transparent
            animationType="none"
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={() => this.dismissDialog()}
          >
            <View
              ref={r => {
                this.overlayRef = r
              }}
              pointerEvents="box-none"
              style={StyleSheet.absoluteFill}
              onLayout={() => {
              this.syncKeyboardInset()
              if (!this.openedFocus) {
                this.openedFocus = true
                this.refMsgBox?.focus()
              }
            }}
            >
              {dialog}
            </View>
          </Modal>
        )}
        <SafeBottom>
          {insetBottom => (
            <FAB
              small={this.props.params.isGitIssue}
              style={{
                position: 'absolute',
                margin: 16,
                right: 0,
                bottom:
                  this.props.fabTopPosition === undefined
                    ? (this.props.fabBottomPosition || 0) + insetBottom
                    : undefined,
                top: this.props.fabTopPosition,
                backgroundColor: this.props.fabBackgroundColor || colors.primary,
              }}
              icon={this.props.fabIcon || 'message'}
              visible={isVisible && !isDialogVisible}
              onPress={() => this.showDialog(true)}
            />
          )}
        </SafeBottom>
      </View>
    )
  }
}
