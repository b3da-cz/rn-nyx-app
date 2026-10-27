import React, { useContext, useMemo, useState } from 'react'
import { Linking, View } from 'react-native'
import { Text, ProgressBar, TouchableRipple } from 'react-native-paper'
import { ButtonComponent } from './ButtonComponent'
import { ImageComponent } from './ImageComponent'
import { SpoilerComponent } from './SpoilerComponent'
import { UserRowComponent } from './UserRowComponent'
import { VideoTagComponent } from './VideoTagComponent'
import { VideoYoutubeComponent } from './VideoYoutubeComponent'
import {
  isPlaceholderImageSize,
  isTextSelectionEnabled,
  MainContext,
  Parser,
  pollAnswers,
  pollContentBlocks,
  pollHtmlSource,
  pollPlainText,
  promptTextFile,
  TOKEN,
  useTheme,
} from '../lib'

const openHref = (url: string | undefined, text: string | undefined, nyx: any, onOpenPost?: Function) => {
  if (!url) {
    return
  }
  if (nyx?.api && promptTextFile(url, text, nyx.api)) {
    return
  }
  Linking.openURL(url).catch(() => {
    if (url.startsWith('/discussion/')) {
      const parts = url.split('/')
      onOpenPost?.(parts[2], parts.length > 3 ? parts[4] : undefined)
    } else if (url.startsWith('/')) {
      Linking.openURL(`https://nyx.cz${url}`).catch(() => null)
    }
  })
}

const PollHtml = ({
  html,
  color,
  fontSize,
  imageWidth,
  images,
  selectable,
  nyx,
  onImage,
  onOpenPost,
}: {
  html?: string
  color?: string
  fontSize: number
  imageWidth: number
  images?: any[]
  selectable?: boolean
  nyx?: any
  onImage?: Function
  onOpenPost?: Function
}) => {
  const { colors } = useTheme()
  const source = pollHtmlSource(html)
  const parsed = useMemo(() => {
    if (!source || !source.includes('<')) {
      return null
    }
    try {
      return new Parser(source, 'text').parse()
    } catch (e) {
      return null
    }
  }, [source])

  if (!source.trim()) {
    return null
  }
  if (!parsed) {
    return (
      <Text selectable={selectable} style={{ color: color || colors.text, fontSize }}>
        {source.trim()}
      </Text>
    )
  }

  const measuredOf = (img: any) => (images || []).find(item => item?.src && item.src === img?.src) || img
  const renderImage = (img: any) => {
    const measured = measuredOf(img)
    if (!measured?.src) {
      return null
    }
    const placeholder = !!measured.skipDownload && !measured.revealed && !measured.cached
    const sized =
      measured.width > 0 && measured.height > 0 && !placeholder && !isPlaceholderImageSize(measured)
    const width = imageWidth
    return (
      <ImageComponent
        key={`${measured.id || measured.src}-${placeholder ? 'ph' : 'img'}`}
        src={measured.src}
        width={width}
        height={sized ? measured.height * (width / measured.width) : placeholder ? width * (2 / 3) : undefined}
        useExactSize={sized}
        skipDownload={placeholder}
        byteLength={measured.byteLength}
        onPress={() => onImage?.(measured, images)}
      />
    )
  }

  const renderPart = (part: string) => {
    if (part.startsWith(TOKEN.REPLY)) {
      const reply = parsed.replies?.find(item => item.id === part.replace(TOKEN.REPLY, ''))
      if (!reply) {
        return null
      }
      return (
        <Text
          key={part}
          style={{ color: colors.accent, fontSize }}
          onPress={() => onOpenPost?.(reply.discussionId, reply.postId)}
        >
          {`${reply.text || ''} `}
        </Text>
      )
    }
    if (part.startsWith(TOKEN.LINK)) {
      const link = parsed.links?.find(item => item.id === part.replace(TOKEN.LINK, ''))
      if (!link) {
        return null
      }
      return (
        <Text
          key={part}
          style={{ color: colors.link, fontSize }}
          onPress={() => openHref(link.url, link.text, nyx, onOpenPost)}
        >
          {`${link.text || link.url || ''} `}
        </Text>
      )
    }
    if (part.startsWith(TOKEN.SPOILER)) {
      const spoiler = parsed.spoilers?.find(item => item.id === part.replace(TOKEN.SPOILER, ''))
      return spoiler ? <SpoilerComponent key={part} text={spoiler.text} /> : null
    }
    if (part.startsWith(TOKEN.CODE)) {
      const code = parsed.codeBlocks?.find(item => item.id === part.replace(TOKEN.CODE, ''))
      return code ? (
        <Text key={part} style={{ color: color || colors.text, fontSize }}>
          {pollPlainText(code.raw)}
        </Text>
      ) : null
    }
    if (part.startsWith(TOKEN.TEXT_BOLD)) {
      const text = parsed.textsBold?.find(item => item.id === part.replace(TOKEN.TEXT_BOLD, ''))
      return text ? (
        <Text key={part} style={{ color: color || colors.text, fontSize, fontWeight: 'bold' }}>
          {text.text}
        </Text>
      ) : null
    }
    if (part.startsWith(TOKEN.TEXT_ITALIC)) {
      const text = parsed.textsItalic?.find(item => item.id === part.replace(TOKEN.TEXT_ITALIC, ''))
      return text ? (
        <Text key={part} style={{ color: color || colors.text, fontSize, fontStyle: 'italic' }}>
          {text.text}
        </Text>
      ) : null
    }
    if (part.startsWith(TOKEN.IMG) || part.startsWith(TOKEN.YT) || part.startsWith(TOKEN.VIDEO)) {
      return null
    }
    return (
      <Text key={part} style={{ color: color || colors.text, fontSize }}>
        {part}
      </Text>
    )
  }

  const renderMedia = (part: string) => {
    if (part.startsWith(TOKEN.IMG)) {
      const img = parsed.images?.find(item => item.id === part.replace(TOKEN.IMG, ''))
      return img ? renderImage(img) : null
    }
    if (part.startsWith(TOKEN.YT)) {
      const video = parsed.ytBlocks?.find(item => item.id === part.replace(TOKEN.YT, ''))
      return video ? (
        <VideoYoutubeComponent key={part} videoId={video.videoId} videoLink={video.link} previewSrc={undefined} />
      ) : null
    }
    if (part.startsWith(TOKEN.VIDEO)) {
      const video = parsed.videos?.find(item => item.id === part.replace(TOKEN.VIDEO, ''))
      return video ? <VideoTagComponent key={part} url={video.link} /> : null
    }
    return null
  }

  const blocks = pollContentBlocks(parsed.contentParts || [])
  if (!blocks.length) {
    const fallback = pollPlainText(source)
    return fallback ? (
      <Text selectable={selectable} style={{ color: color || colors.text, fontSize }}>
        {fallback}
      </Text>
    ) : null
  }
  return (
    <View>
      {blocks.map((block, index) =>
        block.isText ? (
          <Text selectable={selectable} key={`t-${index}`} style={{ color: color || colors.text, fontSize }}>
            {block.parts.map(part => renderPart(part))}
          </Text>
        ) : (
          <View key={`m-${index}`}>{block.parts.map(part => renderMedia(part))}</View>
        ),
      )}
    </View>
  )
}

const answerIsRich = (answer: string) => /[<\n]/.test(answer) || answer.length > 80

export const PollComponent = ({
  label,
  instructions,
  answers,
  allowedAnswers,
  totalRespondents,
  totalVotes,
  votes,
  canVote,
  ended,
  onVote,
  images,
  nyx,
  onImage,
  onOpenPost,
}) => {
  const [selected, setSelected] = useState<any[]>([])
  const {
    colors,
    metrics: { blocks, fontSizes, screen },
  } = useTheme()
  const selectable = isTextSelectionEnabled(useContext(MainContext).config)
  const imageWidth = Math.max(80, screen.width - blocks.large * 2 - blocks.medium * 4)
  const onAnswer = key => {
    if (selected.includes(key)) {
      setSelected([...selected].filter(k => k !== key))
      return
    }
    if (selected.length < allowedAnswers) {
      setSelected([...selected, key])
    } else {
      setSelected([...selected.slice(selected.length + 1 - allowedAnswers), key])
    }
  }
  const choices = pollAnswers(answers)
  const showStats = totalVotes > 0 || totalRespondents > 0
  const votingOpen = !!canVote && !ended
  const showVoteButton = !!canVote
  return (
    <View style={{ paddingHorizontal: blocks.medium }}>
      {label ? (
        <View style={{ padding: blocks.large }}>
          <PollHtml
            html={label}
            fontSize={fontSizes.h3}
            imageWidth={imageWidth}
            images={images}
            selectable={selectable}
            nyx={nyx}
            onImage={onImage}
            onOpenPost={onOpenPost}
          />
        </View>
      ) : null}
      {instructions ? (
        <View style={{ paddingHorizontal: blocks.large, paddingBottom: showStats ? blocks.medium : blocks.large }}>
          <PollHtml
            html={instructions}
            fontSize={fontSizes.p}
            imageWidth={imageWidth}
            images={images}
            selectable={selectable}
            nyx={nyx}
            onImage={onImage}
            onOpenPost={onOpenPost}
          />
        </View>
      ) : null}
      {showStats ? (
        <Text
          selectable={selectable}
          style={{
            paddingHorizontal: blocks.large,
            paddingBottom: blocks.large,
            fontSize: fontSizes.p,
          }}
        >
          {totalVotes > 0 ? `${totalVotes} votes` : ''}
          {totalVotes > 0 && totalRespondents > 0 ? '\n' : ''}
          {totalRespondents > 0 ? `${totalRespondents} respondents` : ''}
        </Text>
      ) : null}
      {votes?.length > 0 &&
        votes.map(r => {
          const choice = pollPlainText(r.answer)
          return (
            <UserRowComponent
              key={r.user.username}
              user={r.user}
              isPressable={false}
              extraText={choice || undefined}
            />
          )
        })}
      {choices.map(choice => {
        const rich = answerIsRich(choice.answer || '')
        const count = choice.result?.respondents_count || ''
        const picked = selected.includes(choice.key)
        const rowStyle = {
          marginTop: choice.result ? 0 : blocks.medium,
          borderWidth: 1,
          borderColor: picked ? colors.accent : rich ? colors.border : colors.background,
          borderRadius: 0,
        }
        const row = (
          <View
            style={{
              flexDirection: 'row',
              alignItems: rich ? 'flex-start' : 'center',
              minHeight: 48,
              paddingVertical: blocks.medium,
              paddingHorizontal: blocks.medium,
            }}
          >
            <View style={{ flex: 1, paddingRight: blocks.small }}>
              <PollHtml
                html={choice.answer}
                color={colors.accent}
                fontSize={fontSizes.p}
                imageWidth={Math.max(80, imageWidth - (count ? 48 : 0))}
                images={images}
                selectable={selectable}
                nyx={nyx}
                onImage={onImage}
                onOpenPost={onOpenPost}
              />
            </View>
            {count ? (
              <Text style={{ color: colors.accent, fontSize: fontSizes.p, marginLeft: blocks.small }}>{count}</Text>
            ) : null}
          </View>
        )
        return (
          <View key={choice.key}>
            {votingOpen ? (
              <TouchableRipple rippleColor={colors.ripple} style={rowStyle} onPress={() => onAnswer(choice.key)}>
                {row}
              </TouchableRipple>
            ) : (
              <View style={rowStyle}>{row}</View>
            )}
            {!!choice.result && (
              <ProgressBar
                progress={choice.result.respondents_count / (totalVotes / 100) / 100}
                color={choice.result.is_my_vote ? colors.accent : colors.primary}
              />
            )}
          </View>
        )
      })}
      {showVoteButton && (
        <ButtonComponent
          isDisabled={!votingOpen || !selected.length}
          label={`Vote! [ max ${allowedAnswers} answer${allowedAnswers > 1 ? 's' : ''} ]`}
          icon={'x-square'}
          textAlign={'center'}
          borderWidth={1}
          borderRadius={0}
          borderColor={votingOpen && selected.length ? colors.accent : colors.disabled}
          color={votingOpen && selected.length ? colors.accent : colors.disabled}
          fontSize={fontSizes.h3}
          marginTop={blocks.large}
          onPress={() => onVote(selected)}
        />
      )}
    </View>
  )
}
