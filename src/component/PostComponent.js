import React, { Component } from 'react'
import { Text, Linking, View } from 'react-native'
import {
  AdvertisementComponent,
  CodeBlockComponent,
  DiceComponent,
  PollComponent,
  PostHeaderComponent,
  ImageComponent,
  LinkComponent,
  SpoilerComponent,
  VideoYoutubeComponent,
} from '../component'
import { Nyx, TOKEN, Styling, generateUuidV4 } from '../lib'

type Props = {
  post: Object,
  nyx: Nyx,
  isDarkMode: boolean,
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
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      ratings: {},
    }
  }

  shouldComponentUpdate(nextProps) {
    return this.props.post.rating !== nextProps.post.rating || this.props.post.reminder !== nextProps.post.reminder
  }

  renderReply(reply) {
    return (
      <LinkComponent
        key={reply.id}
        color={Styling.colors.primary}
        fontSize={Styling.metrics.fontSize.large}
        onPress={() => (reply ? this.props.onDiscussionDetailShow(reply.discussionId, reply.postId) : null)}>
        {!reply.text.includes('@') && '@'}
        {reply.text}
        {!reply.text.includes('@') && ':'}
      </LinkComponent>
    )
  }

  renderLink(link) {
    return (
      <LinkComponent
        key={link.id}
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
        {link.text}
      </LinkComponent>
    )
  }

  renderSpoiler({ id, text }) {
    return <SpoilerComponent key={id} text={text} />
  }

  renderImage(img) {
    if (this.props.post?.content_raw?.type === 'dice' || this.props.post?.content_raw?.type === 'poll') {
      return
    }
    const w = Math.min(Styling.metrics.screen().width, Styling.metrics.screen().height) - 10
    if (!img.src.includes('/images/play') && !img.src.includes('img.youtube.com')) {
      return (
        <ImageComponent
          key={img.id}
          src={img.src}
          width={w}
          backgroundColor={this.props.isDarkMode ? Styling.colors.black : Styling.colors.white}
          onPress={() => this.props.onImage(img)}
        />
      )
    }
  }

  renderCodeBlock(codeBlock) {
    return <CodeBlockComponent key={codeBlock.id} html={codeBlock.raw} />
  }

  renderYtBlock(ytBlock, images) {
    const img = images.filter(i => i.src.includes(ytBlock.videoId))[0]
    return (
      <VideoYoutubeComponent
        key={ytBlock.id}
        videoId={ytBlock.videoId}
        videoLink={ytBlock.link}
        previewSrc={img && img.src}
        width={Styling.metrics.window().width}
        height={Styling.metrics.window().width / 1.777}
        backgroundColor={this.props.isDarkMode ? Styling.colors.black : Styling.colors.white}
      />
    )
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
    return (
      <Text
        key={key}
        style={[
          Styling.groups.themeComponent(this.props.isDarkMode),
          { fontSize: 16, paddingVertical: 2, paddingHorizontal: 2, lineHeight: 22 },
        ]}>
        {text}
      </Text>
    )
  }

  renderDice() {
    const { post } = this.props
    return (
      <DiceComponent
        isDarkMode={this.props.isDarkMode}
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
        isDarkMode={this.props.isDarkMode}
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
    // const { contentParts, images } = this.props.post.parsed
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
        isDarkMode={this.props.isDarkMode}
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
    const { contentParts, links, replies, images, codeBlocks, ytBlocks, spoilers } = this.props.post.parsed
    return (
      <View>
        <PostHeaderComponent
          post={post}
          nyx={this.props.nyx}
          isDarkMode={this.props.isDarkMode}
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
        <View
          style={[
            Styling.groups.themeComponent(this.props.isDarkMode),
            { paddingBottom: 5, borderWidth: 0, borderColor: 'red' },
          ]}>
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
              } else if (part.startsWith(TOKEN.IMG)) {
                const img = images.filter(i => i.id === part.replace(TOKEN.IMG, ''))[0]
                return this.renderImage(img)
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
          {post?.content_raw?.type === 'advertisement' && post?.parsed?.advertisement && this.renderAdvertisement()}
          {post?.content_raw?.type === 'dice' && this.renderDice()}
          {post?.content_raw?.type === 'poll' && this.renderPoll()}
        </View>
      </View>
    )
  }
}
