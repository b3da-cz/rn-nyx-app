import React, { Component } from 'react'
import { Text, Linking, View } from 'react-native'
import {
  CodeBlockComponent,
  PostHeaderComponent,
  ImageComponent,
  LinkComponent,
  SpoilerComponent,
  VideoYoutubeComponent,
} from '../component'
import { Nyx, Parser, TOKEN, Styling } from '../lib'

type Props = {
  post: Object,
  nyx: Nyx,
  isDarkMode: boolean,
  isHeaderInteractive: boolean,
  onHeaderPress?: Function,
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
      visibleSpoilers: {},
    }
  }

  componentDidMount() {
    setTimeout(() => this.parseContent(), 10)
  }

  parseContent() {
    const parser = new Parser(this.props.post.content)
    const { contentParts, links, replies, images, codeBlocks, ytBlocks, spoilers } = parser.parse()
    this.setState({ contentParts, links, replies, images, codeBlocks, ytBlocks, spoilers })
  }

  renderReply(reply) {
    return (
      <LinkComponent
        color={Styling.colors.primary}
        fontSize={Styling.metrics.fontSize.large}
        onPress={() => (reply ? this.props.onDiscussionDetailShow(reply.discussionId, reply.postId) : null)}>
        {!reply.text.includes('@') && '@'}
        {reply.text}
      </LinkComponent>
    )
  }

  renderLink(link) {
    return (
      <LinkComponent
        onPress={() => Linking.openURL(link.url).catch(() => console.warn('failed to open ', link.url, link))}>
        {link.text}
      </LinkComponent>
    )
  }

  renderSpoiler({ id, text }) {
    return (
      <SpoilerComponent
        text={text}
        isVisible={this.state.visibleSpoilers[id]}
        onPress={() => this.setState({ visibleSpoilers: { ...this.state.visibleSpoilers, ...{ [id]: true } } })}
      />
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
      let w = Math.min(Styling.metrics.screen().width, Styling.metrics.screen().height) - 10
      let h = Math.min(Styling.metrics.screen().width, Styling.metrics.screen().height) - 10
      return (
        <ImageComponent
          src={img.src}
          width={w}
          height={h / 2.5}
          backgroundColor={this.props.isDarkMode ? Styling.colors.black : Styling.colors.white}
          onPress={() =>
            this.props.onImages(
              images.map(i => ({ url: i.src })),
              imgIndex,
            )
          }
        />
      )
    }
  }

  renderCodeBlock(codeBlock) {
    return <CodeBlockComponent html={codeBlock.raw} />;
  }

  renderYtBlock(ytBlock, images) {
    const img = images.filter(i => i.src.includes(ytBlock.videoId))[0]
    return (
      <VideoYoutubeComponent
        videoId={ytBlock.videoId}
        videoLink={ytBlock.link}
        previewSrc={img && img.src}
        width={Styling.metrics.window().width}
        height={Styling.metrics.window().width / 1.777}
        backgroundColor={this.props.isDarkMode ? Styling.colors.black : Styling.colors.white}
        isPlayerVisible={this.state.enabledYtPlayers[ytBlock.videoId]}
        onPreviewPress={() =>
          this.setState({ enabledYtPlayers: { ...this.state.enabledYtPlayers, ...{ [ytBlock.videoId]: true } } })
        }
      />
    )
  }

  renderTextNode(text) {
    return (
      <Text
        style={[
          Styling.groups.themeComponent(this.props.isDarkMode),
          { fontSize: 16, paddingVertical: 2, paddingHorizontal: 2, lineHeight: 22 },
        ]}>
        {text
          .split('<br>')
          .join('\n')
          .split('<br />')
          .join('\n')
          .split('\n\n')
          .join('\n')
          .replace(/(<([^>]+)>)/gi, '')}
      </Text>
    )
  }

  render() {
    const { post } = this.props
    const { contentParts, links, replies, images, codeBlocks, ytBlocks, spoilers } = this.state
    return (
      <View>
        <PostHeaderComponent
          post={post}
          nyx={this.props.nyx}
          isDarkMode={this.props.isDarkMode}
          isInteractive={this.props.isHeaderInteractive}
          onPress={postId => this.props.onHeaderPress(postId)}
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
              } else if (part.startsWith(TOKEN.SPOILER)) {
                const spoiler = spoilers.filter(s => s.id === part.replace(TOKEN.SPOILER, ''))[0]
                return this.renderSpoiler(spoiler)
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
