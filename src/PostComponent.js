import React, { Component } from 'react'
import { Text, TouchableOpacity, Linking, Image, View } from 'react-native'
import { generateUuidV4, PostHeaderComponent, Nyx, Styling } from './'
import AutoHeightWebView from 'react-native-autoheight-webview'
import YoutubePlayer from 'react-native-youtube-iframe'
import { parse } from 'node-html-parser'

type Props = {
  post: Object,
  isDarkMode: boolean,
  nyx: Nyx,
  onDiscussionDetailShow: Function,
  onImages: Function,
  onDelete: Function,
}
export class PostComponent extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      ratings: {},
      enabledYtPlayers: {},
    }
  }

  renderReply(reply) {
    return (
      <TouchableOpacity
        // style={{borderWidth: 1, borderColor: 'blue'}}
        accessibilityRole="button"
        onPress={() => (reply ? this.props.onDiscussionDetailShow(reply.discussionId, reply.postId) : null)}>
        <Text
          style={[
            Styling.groups.description,
            Styling.groups.themeComponent(this.props.isDarkMode),
            { color: Styling.colors.primary, fontSize: 16, margin: 0, paddingVertical: 5 },
          ]}>
          @{reply.text}
        </Text>
      </TouchableOpacity>
    )
  }

  renderLink(link) {
    return (
      <TouchableOpacity
        // style={{borderWidth: 1, borderColor: 'red'}}
        accessibilityRole="button"
        onPress={() => Linking.openURL(link.url).catch(() => console.warn('failed to open ', link.url, link))}>
        <Text
          style={[
            Styling.groups.description,
            Styling.groups.themeComponent(this.props.isDarkMode),
            { color: Styling.colors.secondary, fontSize: 16, margin: 0, paddingVertical: 5 },
          ]}>
          {link.text}
        </Text>
      </TouchableOpacity>
    )
  }

  renderImage(img, images) {
    if (!img.src.includes('/images/play') && !img.src.includes('img.youtube.com')) {
      let imgIndex = 0
      images.forEach((im, i) => {
        // meh meh meh todo
        if (im.src === img.src) {
          imgIndex = i
        }
      })
      let w = Math.min(Styling.metrics.screen.width, Styling.metrics.screen.height) - 10
      let h = Math.min(Styling.metrics.screen.width, Styling.metrics.screen.height) - 10
      return (
        <TouchableOpacity
          // style={{borderWidth: 1, borderColor: 'green'}}
          accessibilityRole="button"
          onPress={() =>
            this.props.onImages(
              images.map(i => ({ url: i.src })),
              imgIndex,
            )
          }>
          <Image
            style={{
              width: w,
              height: h / 2.5,
              margin: 5,
              backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white,
            }}
            resizeMethod={'scale'}
            resizeMode={'center'}
            source={{ uri: img.src }}
          />
        </TouchableOpacity>
      )
    }
  }

  renderCodeBlock(codeBlock) {
    return (
      <View>
        <AutoHeightWebView
          style={{ width: Styling.metrics.screen.width - 10, marginHorizontal: 5 }}
          customStyle={`
                      pre {
                        font-size: 10px;
                      }
                    `}
          source={{ html: codeBlock.raw }}
          scalesPageToFit={false}
          viewportContent={'width=device-width, user-scalable=no'}
        />
      </View>
    )
  }

  renderYtBlock(ytBlock, images) {
    const img = images.filter(i => i.src.includes(ytBlock.videoId))[0]
    return (
      <View>
        {this.state.enabledYtPlayers[ytBlock.videoId] ? (
          <YoutubePlayer height={Styling.metrics.window.width / 1.777} videoId={ytBlock.videoId} />
        ) : (
          <TouchableOpacity
            // style={{borderWidth: 1, borderColor: 'green'}}
            accessibilityRole="button"
            onPress={() =>
              this.setState({ enabledYtPlayers: { ...this.state.enabledYtPlayers, ...{ [ytBlock.videoId]: true } } })
            }>
            <Image
              style={{
                width: Styling.metrics.window.width,
                height: Styling.metrics.window.width / 1.777,
                margin: 5,
                backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white,
              }}
              resizeMethod={'scale'}
              resizeMode={'center'}
              source={{ uri: img && img.src }}
            />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  renderTextNode(text) {
    return (
      <Text
        style={[
          Styling.groups.description,
          Styling.groups.themeComponent(this.props.isDarkMode),
          { fontSize: 16, paddingVertical: 2 },
        ]}>
        {text
          .split('<br>')
          .join('\r\n')
          .split('<br />')
          .join('\r\n')
          .replace(/(<([^>]+)>)/gi, '')}
      </Text>
    )
  }

  render() {
    const { post } = this.props
    const html = parse(`<div>${post.content}</div>`)
    // todo: spoilers, text formatting
    const replies = html.querySelectorAll('a[data-discussion-id]').map(a => ({
      id: generateUuidV4(),
      raw: a.toString(),
      text: a.innerText,
      discussionId: a.getAttribute('data-discussion-id'),
      postId: a.getAttribute('data-id'),
    }))
    const links = html
      .querySelectorAll('a')
      .filter(
        a =>
          !a.hasAttribute('data-discussion-id') &&
          !a.getAttribute('href').includes('youtube') &&
          !a.getAttribute('href').includes('youtu.be'),
      )
      .map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        text: a.innerText,
        url: a.getAttribute('href'),
      }))
    const images = html.querySelectorAll('img').map(i => ({
      id: generateUuidV4(),
      raw: i.toString(),
      src: i.getAttribute('src'),
      thumb: i.getAttribute('data-thumb'),
    }))
    const codeBlocks = html.querySelectorAll('pre').map(p => ({
      id: generateUuidV4(),
      raw: p.toString(),
    }))
    // const ytBlocks = html.querySelectorAll('div.embed-wrapper')
    const ytBlocks = html
      .querySelectorAll('a')
      .filter(a => a.getAttribute('href').includes('youtube') || a.getAttribute('href').includes('youtu.be'))
      .map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        text: a.innerText,
        videoId: a.getAttribute('href').includes('youtube')
          ? a.getAttribute('href').replace('https://www.youtube.com/watch?v=', '')
          : a.getAttribute('href').replace('https://youtu.be/', ''),
      }))
    const ytBlocksToDelete = html.querySelectorAll('div.embed-wrapper').map(a => ({
      id: generateUuidV4(),
      raw: a.toString(),
      videoId: a.getAttribute('data-embeded-type'),
    }))

    const TOKEN = {
      // meh todo
      SPLIT: '//######//',
      REPLY: '###R#',
      LINK: '###L#',
      IMG: '###I#',
      CODE: '###C#',
      YT: '###Y#',
    }
    let content = post.content
    replies.forEach(l => (content = content.split(l.raw).join(`${TOKEN.SPLIT}${TOKEN.REPLY}${l.id}${TOKEN.SPLIT}`)))
    links.forEach(l => (content = content.split(l.raw).join(`${TOKEN.SPLIT}${TOKEN.LINK}${l.id}${TOKEN.SPLIT}`)))
    images.forEach(i => (content = content.split(i.raw).join(`${TOKEN.SPLIT}${TOKEN.IMG}${i.id}${TOKEN.SPLIT}`)))
    codeBlocks.forEach(c => (content = content.split(c.raw).join(`${TOKEN.SPLIT}${TOKEN.CODE}${c.id}${TOKEN.SPLIT}`)))
    ytBlocks.forEach(y => (content = content.split(y.raw).join(`${TOKEN.SPLIT}${TOKEN.YT}${y.id}${TOKEN.SPLIT}`)))
    ytBlocksToDelete.forEach(y => (content = content.split(y.raw).join('')))
    const contentParts = content.split(TOKEN.SPLIT)
    return (
      <View>
        <PostHeaderComponent
          post={post}
          isDarkMode={this.props.isDarkMode}
          nyx={this.props.nyx}
          onDelete={postId => this.props.onDelete(postId)}
        />
        <View
          style={[
            Styling.groups.themeComponent(this.props.isDarkMode),
            { paddingBottom: 5, borderWidth: 0, borderColor: 'red' },
          ]}>
          {contentParts &&
            contentParts.length > 0 &&
            contentParts.map(part => {
              if (part.startsWith(TOKEN.REPLY)) {
                const reply = replies.filter(l => l.id === part.replace(TOKEN.REPLY, ''))[0]
                return this.renderReply(reply)
              } else if (part.startsWith(TOKEN.LINK)) {
                const link = links.filter(l => l.id === part.replace(TOKEN.LINK, ''))[0]
                return this.renderLink(link)
              } else if (part.startsWith(TOKEN.IMG)) {
                const img = images.filter(i => i.id === part.replace(TOKEN.IMG, ''))[0]
                return this.renderImage(img, images)
              } else if (part.startsWith(TOKEN.CODE)) {
                const codeBlock = codeBlocks.filter(c => c.id === part.replace(TOKEN.CODE, ''))[0]
                return this.renderCodeBlock(codeBlock)
              } else if (part.startsWith(TOKEN.YT)) {
                const ytBlock = ytBlocks.filter(c => c.id === part.replace(TOKEN.YT, ''))[0]
                return this.renderYtBlock(ytBlock, images)
              } else if (!part || (part && part.length === 0)) {
                return null
              } else {
                return this.renderTextNode(part)
              }
            })}
        </View>
      </View>
    )
  }
}
