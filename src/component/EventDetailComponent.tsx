import React, { useState } from 'react'
import { Linking, ScrollView, View } from 'react-native'
import { Dialog, Portal, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import type { EventAttendee } from 'nyx-api'
import {
  discussionTarget,
  EventDetailData,
  EventDetailImage,
  formatEventDuration,
  friendAttendees,
  t,
  TOKEN,
  useTheme,
} from '../lib'
import { CodeBlockComponent } from './CodeBlockComponent'
import { ImageComponent } from './ImageComponent'
import { SpoilerComponent } from './SpoilerComponent'
import { UserIconComponent } from './UserIconComponent'
import { VideoYoutubeComponent } from './VideoYoutubeComponent'

type Props = {
  detail: EventDetailData
  onImage: (image: EventDetailImage, images: EventDetailImage[]) => void
  onOpenDiscussion: (discussionId: string, postId?: string) => void
}

const FRIEND_LIMIT = 6

export const EventDetailComponent = ({ detail, onImage, onOpenDiscussion }: Props) => {
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false)
  const {
    colors,
    metrics: { blocks, fontSizes, screen },
  } = useTheme()
  const place = [(detail.areaName || '').replace(' - ', ' – '), (detail.location || '').trim()]
    .filter(part => part.length > 0)
    .join(' | ')
  const when = detail.start && detail.end ? formatEventDuration(detail.start, detail.end) : ''
  const friends = friendAttendees(detail.attendees)
  const shownFriends = friends.slice(0, FRIEND_LIMIT)
  const imageWidth = screen.width - 2 * blocks.large

  return (
    <View>
      <View style={{ paddingHorizontal: blocks.medium, paddingTop: blocks.medium }}>
        {!!detail.owner && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: blocks.medium }}>
            <UserIconComponent username={detail.owner} marginRight={blocks.medium} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.faded, fontSize: fontSizes.small }}>{t('events.hostedBy')}</Text>
              <Text style={{ color: colors.text, fontSize: fontSizes.p, fontWeight: '700' }}>{detail.owner}</Text>
            </View>
          </View>
        )}
        {!!when && <Text style={{ color: colors.text, fontSize: fontSizes.p }}>{when}</Text>}
        {!!place && (
          <Text style={{ color: colors.faded, fontSize: fontSizes.p, marginTop: when ? 2 : 0 }}>{place}</Text>
        )}
      </View>
      <EventBody
        parsed={detail.parsed}
        imageWidth={imageWidth}
        images={detail.images}
        onImage={onImage}
        onOpenDiscussion={onOpenDiscussion}
      />
      <TouchableRipple rippleColor={colors.ripple} onPress={() => setIsAttendeesOpen(true)}>
        <View
          style={{
            backgroundColor: colors.row,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: blocks.medium,
            paddingVertical: blocks.medium,
            marginTop: blocks.small,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, flexWrap: 'wrap' }}>
            {detail.going > 0 && <CountPill count={detail.going} label={t('events.going')} />}
            {detail.interested > 0 && (
              <CountPill count={detail.interested} label={t('events.interested')} marginLeft={detail.going > 0} />
            )}
            {detail.going === 0 && detail.interested === 0 && (
              <Text style={{ color: colors.faded, fontSize: fontSizes.p }}>{t('events.nobody')}</Text>
            )}
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {shownFriends.map((friend, index) => (
              <UserIconComponent
                key={friend.username}
                username={friend.username}
                width={26}
                height={32}
                marginLeft={index === 0 ? 0 : -8}
              />
            ))}
            {friends.length > shownFriends.length && (
              <Text style={{ color: colors.faded, fontSize: fontSizes.small, marginLeft: 4 }}>
                +{friends.length - shownFriends.length}
              </Text>
            )}
          </View>
        </View>
      </TouchableRipple>
      <AttendeesDialog
        visible={isAttendeesOpen}
        attendees={detail.attendees}
        onDismiss={() => setIsAttendeesOpen(false)}
      />
    </View>
  )
}

const CountPill = ({ count, label, marginLeft = false }: { count: number; label: string; marginLeft?: boolean }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: marginLeft ? blocks.medium : 0 }}>
      <View
        style={{
          backgroundColor: colors.background,
          borderRadius: 4,
          paddingHorizontal: 7,
          paddingVertical: 1,
        }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSizes.small }}>{count}</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: fontSizes.small }}> {label}</Text>
    </View>
  )
}

const AttendeesDialog = ({
  visible,
  attendees,
  onDismiss,
}: {
  visible: boolean
  attendees: EventAttendee[]
  onDismiss: () => void
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes, screen },
  } = useTheme()
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title style={{ marginBottom: blocks.small }}>{t('events.attendees')}</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: blocks.medium, maxHeight: screen.height * 0.6 }}>
          <ScrollView>
            {attendees.length === 0 && (
              <Text style={{ color: colors.faded, fontSize: fontSizes.p, marginVertical: blocks.medium }}>
                {t('events.nobody')}
              </Text>
            )}
            {attendees.map(attendee => (
              <View
                key={attendee.username}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: blocks.small,
                }}>
                <UserIconComponent username={attendee.username} width={32} height={40} marginRight={blocks.medium} />
                <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: fontSizes.p }}>
                  {attendee.username}
                </Text>
                <Icon
                  name={attendee.attendance_type === 'going' ? 'user' : 'eye'}
                  size={fontSizes.h3}
                  color={colors.accent}
                />
              </View>
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  )
}

const EventBody = ({
  parsed,
  imageWidth,
  images,
  onImage,
  onOpenDiscussion,
}: {
  parsed: EventDetailData['parsed']
  imageWidth: number
  images: EventDetailImage[]
  onImage: (image: EventDetailImage, images: EventDetailImage[]) => void
  onOpenDiscussion: (discussionId: string, postId?: string) => void
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  if (!parsed?.contentParts?.length && images.length === 0) {
    return null
  }
  const openLink = (url: string) => {
    const target = discussionTarget(url)
    if (target) {
      onOpenDiscussion(target.discussionId, target.postId)
      return
    }
    const absolute = url?.startsWith('/') ? `https://nyx.cz${url}` : url
    Linking.openURL(absolute).catch(() => null)
  }
  const inline = new Set((parsed?.images || []).map(image => image.src).filter(Boolean))
  const extras = images.filter(image => !inline.has(image.src))
  const parts: string[] = parsed?.contentParts || []
  const isText = (part: string) =>
    part.startsWith(TOKEN.LINK) ||
    part.startsWith(TOKEN.SPOILER) ||
    part.startsWith(TOKEN.TEXT_BOLD) ||
    part.startsWith(TOKEN.TEXT_ITALIC) ||
    (part.length > 0 && !part.startsWith('###'))
  const groups: { isText: boolean; parts: string[] }[] = []
  let current: { isText: boolean; parts: string[] } | null = null
  for (const part of parts) {
    if (!part) {
      continue
    }
    const text = isText(part)
    if (!current || current.isText !== text) {
      if (current) {
        groups.push(current)
      }
      current = { isText: text, parts: [part] }
      continue
    }
    current.parts.push(part)
  }
  if (current) {
    groups.push(current)
  }

  const renderText = (part: string, index: number) => {
    if (part.startsWith(TOKEN.LINK)) {
      const link = (parsed?.links || []).find(item => item.id === part.replace(TOKEN.LINK, ''))
      if (!link?.url) {
        return null
      }
      return (
        <Text
          key={`${link.id}-${index}`}
          style={{ color: colors.link, fontSize: fontSizes.p }}
          onPress={() => openLink(link.url)}>
          {`${link.text || link.url} `}
        </Text>
      )
    }
    if (part.startsWith(TOKEN.SPOILER)) {
      const spoiler = (parsed?.spoilers || []).find(item => item.id === part.replace(TOKEN.SPOILER, ''))
      return spoiler ? <SpoilerComponent key={spoiler.id} text={spoiler.text} /> : null
    }
    if (part.startsWith(TOKEN.TEXT_BOLD)) {
      const text = (parsed?.textsBold || []).find(item => item.id === part.replace(TOKEN.TEXT_BOLD, ''))
      return text ? (
        <Text key={text.id} style={{ color: colors.text, fontSize: fontSizes.p, fontWeight: '700' }}>
          {text.text}
        </Text>
      ) : null
    }
    if (part.startsWith(TOKEN.TEXT_ITALIC)) {
      const text = (parsed?.textsItalic || []).find(item => item.id === part.replace(TOKEN.TEXT_ITALIC, ''))
      return text ? (
        <Text key={text.id} style={{ color: colors.text, fontSize: fontSizes.p, fontStyle: 'italic' }}>
          {text.text}
        </Text>
      ) : null
    }
    if (part.startsWith('###')) {
      return null
    }
    return (
      <Text key={`t-${index}`} style={{ color: colors.text, fontSize: fontSizes.p }}>
        {part}
      </Text>
    )
  }

  const renderBlockPart = (part: string) => {
    if (part.startsWith(TOKEN.IMG)) {
      const image = (parsed?.images || []).find(item => item.id === part.replace(TOKEN.IMG, ''))
      if (!image?.src || image.src.includes('img.youtube.com')) {
        return null
      }
      return (
        <ImageComponent
          key={image.id}
          src={image.src}
          width={imageWidth}
          onPress={() => onImage({ src: image.src, url: image.src }, images)}
        />
      )
    }
    if (part.startsWith(TOKEN.YT)) {
      const video = (parsed?.ytBlocks || []).find(item => item.id === part.replace(TOKEN.YT, ''))
      return video?.videoId && video.videoId !== 'error' ? (
        <VideoYoutubeComponent
          key={video.id}
          videoId={video.videoId}
          videoLink={video.link}
          previewSrc={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
        />
      ) : null
    }
    if (part.startsWith(TOKEN.CODE)) {
      const code = (parsed?.codeBlocks || []).find(item => item.id === part.replace(TOKEN.CODE, ''))
      return code ? <CodeBlockComponent key={code.id} html={code.raw} height={code.height || 0} /> : null
    }
    return null
  }

  return (
    <View style={{ marginTop: blocks.small, marginBottom: blocks.small }}>
      {groups.map((block, index) =>
        block.isText ? (
          <Text
            key={`b-${index}`}
            style={{ color: colors.text, fontSize: fontSizes.p, paddingHorizontal: blocks.medium }}>
            {block.parts.map(renderText)}
          </Text>
        ) : (
          <View key={`b-${index}`}>{block.parts.map(renderBlockPart)}</View>
        ),
      )}
      {extras.map(image => (
        <ImageComponent key={image.src} src={image.src} width={imageWidth} onPress={() => onImage(image, images)} />
      ))}
    </View>
  )
}
