import React, { Component } from 'react'
import { Linking, View } from 'react-native'
import { Text } from 'react-native-paper'
import {
  AdvertisementComponent,
  CodeBlockComponent,
  DiceComponent,
  PollComponent,
  PostHeaderComponent,
  ImageComponent,
  SpoilerComponent,
  TextComponent,
  VideoYoutubeComponent,
  VideoTagComponent,
} from '../component'
import { Nyx, TOKEN, generateUuidV4, MainContext } from '../lib'

type Props = {
  post: Object,
  nyx: Nyx,
  isReply?: boolean,
  isUnread?: boolean,
  isHeaderInteractive: boolean,
  isHeaderPressable: boolean,
  onHeaderPress?: Function,
  onHeaderSwipe?: Function,
  onDiscussionDetailShow: Function,
  onRepliesShow: Function,
  onReply?: Function,
  onImage: Function,
  onDelete: Function,
  onPostRated?: Function,
  onReminder?: Function,
  onDiceRoll?: Function,
  onPollVote?: Function,
}
export class PostComponent extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      ratings: {},
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return (
      this.props.post.rating !== nextProps.post.rating ||
      this.props.post.reminder !== nextProps.post.reminder ||
      this.context.theme !== nextContext.theme
    )
  }

  renderReply(reply) {
    return (
      <TextComponent
        key={reply.id}
        isPressable={true}
        isReply={true}
        onPress={() => (reply ? this.props.onDiscussionDetailShow(reply.discussionId, reply.postId) : null)}>
        {reply.text}
        {!reply.text.startsWith('[') ? ': ' : ' '}
      </TextComponent>
    )
  }

  renderLink(link) {
    return (
      <TextComponent
        key={link.id}
        isPressable={true}
        onPress={() => {
          Linking.openURL(link.url).catch(() => {
            if (link.url.startsWith('/discussion/')) {
              const parts = link.url.split('/')
              this.props.onDiscussionDetailShow(parts[2], parts.length > 3 ? parts[4] : null)
            } else if (link.url.startsWith('/')) {
              Linking.openURL(`https://nyx.cz${link.url}`)
            } else {
              console.warn('failed to open ', link.url, link)
            }
          })
        }}>
        {`${link.text} `}
      </TextComponent>
    )
  }

  renderSpoiler({ id, text }) {
    return <SpoilerComponent key={id} text={text} />
  }

  renderImage(img) {
    if (!img?.src || this.props.post?.content_raw?.type === 'dice' || this.props.post?.content_raw?.type === 'poll') {
      return
    }
    const w = this.context.theme.metrics.screen.width - 2 * this.context.theme.metrics.blocks.large
    if (!img.src.includes('img.youtube.com')) {
      return (
        <ImageComponent
          key={img.id}
          src={img.src}
          width={w}
          height={img.height > 0 ? img.height * (w / img.width) : undefined}
          useExactSize={img.width > 0}
          onPress={() => this.props.onImage(img)}
        />
      )
    }
  }

  renderCodeBlock(codeBlock) {
    return <CodeBlockComponent key={codeBlock.id} html={codeBlock.raw} height={codeBlock.height} />
  }

  renderYtBlock(ytBlock, images) {
    const img = images.filter(i => i.src.includes(ytBlock.videoId))[0]
    return (
      <VideoYoutubeComponent
        key={ytBlock.id}
        videoId={ytBlock.videoId}
        videoLink={ytBlock.link}
        previewSrc={img && img.src}
      />
    )
  }

  renderVideoBlock(video) {
    return <VideoTagComponent key={video.id} url={video.link} />
  }

  renderTextNode(text) {
    if (
      this.props.post?.content_raw?.type === 'dice' ||
      this.props.post?.content_raw?.type === 'poll' ||
      !text ||
      (text && (text.length === 0 || text === ' '))
    ) {
      return
    }
    const key = generateUuidV4()
    return <TextComponent key={key}>{`${text} `}</TextComponent>
  }

  renderDice() {
    const { post } = this.props
    return (
      <DiceComponent
        label={post?.content_raw?.data?.reason}
        count={post?.content_raw?.data?.dice_count}
        sides={post?.content_raw?.data?.dice_sides}
        rolls={post?.content_raw?.data?.rolls}
        canRoll={!post?.content_raw?.data?.computed_values?.user_did_roll}
        onRoll={() => this.rollDice()}
      />
    )
  }

  renderPoll() {
    const { post } = this.props
    return (
      <PollComponent
        label={post?.content_raw?.data?.question}
        instructions={post?.content_raw?.data?.instructions}
        answers={post?.content_raw?.data?.answers}
        totalRespondents={post?.content_raw?.data?.computed_values?.total_respondents}
        totalVotes={post?.content_raw?.data?.computed_values?.total_votes}
        allowedAnswers={post?.content_raw?.data?.allowed_votes}
        votes={post?.content_raw?.data?.votes}
        canVote={!post?.content_raw?.data?.computed_values?.user_did_vote}
        onVote={answer => this.voteInPoll(answer)}
      />
    )
  }

  async rollDice() {
    let res = null
    if (this.props.post.location === 'header' || this.props.post.location === 'home') {
      res = await this.props.nyx.rollDiceInHeader(this.props.post.discussion_id, this.props.post.id)
    } else {
      res = await this.props.nyx.rollDice(this.props.post.discussion_id, this.props.post.id)
    }
    this.props.onDiceRoll(res)
  }

  async voteInPoll(answers) {
    let res = null
    if (this.props.post.location === 'header' || this.props.post.location === 'home') {
      res = await this.props.nyx.voteInHeaderPoll(this.props.post.discussion_id, this.props.post.id, answers)
    } else {
      res = await this.props.nyx.voteInPoll(this.props.post.discussion_id, this.props.post.id, answers)
    }
    this.props.onPollVote(res)
  }

  renderAdvertisement() {
    const { action, title, location, price, updated } = this.props.post.parsed.advertisement
    const { post } = this.props
    const images =
      post.content_raw?.data?.photo_ids?.length > 0 &&
      post.content_raw?.data?.photo_ids.map(p => ({ id: generateUuidV4(), url: `https://nyx.cz${p}` }))
    const key = generateUuidV4()
    return (
      <AdvertisementComponent
        key={key}
        action={action}
        title={title}
        summary={post.content_raw?.data?.summary}
        repliesCount={post.content_raw?.data?.posts_count}
        images={images}
        location={location}
        price={price}
        updated={updated}
        isActive={post.content_raw?.data?.state === 'active'}
        onPress={() => this.props.onDiscussionDetailShow(post.content_raw?.data?.discussion_id)}
        onImage={img => this.props.onImage(img, images)}
      />
    )
  }

  render() {
    if (!this.props.post.parsed) {
      return (
        <View>
          <Text>error: not parsed</Text>
        </View>
      )
    }
    const { post } = this.props
    const { contentParts, links, replies, images, codeBlocks, ytBlocks, spoilers, videos } = post.parsed
    const { colors } = this.context.theme
    const hasTextTypeBlock = () =>
      post?.content_raw?.type !== 'advertisement' &&
      contentParts?.length > 0 &&
      contentParts.filter(
        part =>
          part.startsWith(TOKEN.REPLY) ||
          part.startsWith(TOKEN.LINK) ||
          part.startsWith(TOKEN.SPOILER) ||
          part.startsWith(TOKEN.CODE) ||
          (part?.length > 0 && !part.startsWith('###')),
      ).length > 0
    return (
      <View
        style={{
          height: post?.parsed?.height,
          paddingBottom: post?.parsed?.height > 0 ? undefined : 10,
          backgroundColor: colors.background,
          // borderWidth: post?.parsed?.height > 0 && post?.parsed?.height !== 300 ? 1 : 0,
        }}>
        <PostHeaderComponent
          post={post}
          nyx={this.props.nyx}
          theme={this.context.theme}
          isReply={this.props.isReply}
          isUnread={this.props.isUnread}
          isInteractive={this.props.isHeaderInteractive}
          isPressable={this.props.isHeaderPressable}
          onPress={(discussionId, postId) =>
            typeof this.props.onHeaderPress === 'function' ? this.props.onHeaderPress(discussionId, postId) : null
          }
          onReply={(discussionId, postId, username) =>
            typeof this.props.onReply === 'function' ? this.props.onReply(discussionId, postId, username) : null
          }
          onRepliesShow={(discussionId, postId) =>
            typeof this.props.onRepliesShow === 'function' ? this.props.onRepliesShow(discussionId, postId) : null
          }
          onDelete={postId => this.props.onDelete(postId)}
          onPostRated={updatedPost => this.props.onPostRated(updatedPost)}
          onReminder={(p, isReminder) => this.props.onReminder(p, isReminder)}
          onSwipe={isSwiping =>
            typeof this.props.onHeaderSwipe === 'function' ? this.props.onHeaderSwipe(isSwiping) : null
          }
        />
        {hasTextTypeBlock() && (
          <Text style={{ paddingHorizontal: 5, paddingTop: 5 }}>
            {post?.content_raw?.type !== 'advertisement' &&
              contentParts?.length > 0 &&
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
                } else if (part.startsWith(TOKEN.CODE)) {
                  const codeBlock = codeBlocks.filter(c => c.id === part.replace(TOKEN.CODE, ''))[0]
                  return this.renderCodeBlock(codeBlock)
                } else if (part?.length > 0 && !part.startsWith('###')) {
                  return this.renderTextNode(part)
                }
              })}
          </Text>
        )}
        <View style={{ paddingHorizontal: 5 }}>
          {post?.content_raw?.type !== 'advertisement' &&
            contentParts?.length > 0 &&
            contentParts.map(part => {
              if (part.startsWith(TOKEN.IMG)) {
                const img = images.filter(i => i.id === part.replace(TOKEN.IMG, ''))[0]
                return this.renderImage(img)
              } else if (part.startsWith(TOKEN.YT)) {
                const ytBlock = ytBlocks.filter(c => c.id === part.replace(TOKEN.YT, ''))[0]
                return this.renderYtBlock(ytBlock, images)
              } else if (part.startsWith(TOKEN.VIDEO)) {
                const video = videos.filter(c => c.id === part.replace(TOKEN.VIDEO, ''))[0]
                return this.renderVideoBlock(video)
              }
            })}
          {post?.content_raw?.type === 'advertisement' && post?.parsed?.advertisement && this.renderAdvertisement()}
          {post?.content_raw?.type === 'dice' && this.renderDice()}
          {post?.content_raw?.type === 'poll' && this.renderPoll()}
        </View>
      </View>
    )
  }
}
