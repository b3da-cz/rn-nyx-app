import React, { useContext, useRef, useState } from 'react'
import { ActivityIndicator, Linking, ScrollView, View } from 'react-native'
import { Dialog, Portal, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import type { EventAttendee } from 'nyx-api'
import {
  discussionTarget,
  EventDetailData,
  isTextSelectionEnabled,
  EventDetailImage,
  eventIconRow,
  formatEventDuration,
  friendAttendees,
  MainContext,
  MyAttendance,
  Styling,
  t,
  TOKEN,
  useTheme,
} from '../lib'
import { CodeBlockComponent } from './CodeBlockComponent'
import { ImageComponent } from './ImageComponent'
import { SpoilerComponent } from './SpoilerComponent'
import { UserIconComponent } from './UserIconComponent'
import { UserRowComponent } from './UserRowComponent'
import { VideoYoutubeComponent } from './VideoYoutubeComponent'

type Props = {
  detail: EventDetailData
  isAttendanceSaving?: boolean
  onAttendance: (attendance: MyAttendance) => void
  onImage: (image: EventDetailImage, images: EventDetailImage[]) => void
  onOpenDiscussion: (discussionId: string, postId?: string) => void
  onReloadAttendees?: () => Promise<void> | void
}

const ICON_W = 32
const ICON_H = 40

const RSVP: MyAttendance[] = ['going', 'interested', 'none']

export const EventDetailComponent = ({
  detail,
  isAttendanceSaving,
  onAttendance,
  onImage,
  onOpenDiscussion,
  onReloadAttendees,
}: Props) => {
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false)
  const [isAttendeesLoading, setIsAttendeesLoading] = useState(false)
  const attendeesRequest = useRef(0)
  const {
    colors,
    metrics: { blocks, fontSizes, screen },
  } = useTheme()
  const place = [(detail.areaName || '').replace(' - ', ' – '), (detail.location || '').trim()]
    .filter(part => part.length > 0)
    .join(' | ')
  const when = detail.start && detail.end ? formatEventDuration(detail.start, detail.end) : ''
  const imageWidth = screen.width - 2 * blocks.large
  const rowStyle = {
    backgroundColor: colors.row,
    borderLeftWidth: 3,
    borderColor: colors.primary,
    paddingHorizontal: blocks.medium,
    paddingVertical: blocks.medium,
    marginBottom: blocks.small,
  }
  const total = (detail.going || 0) + (detail.interested || 0)
  const context = useContext(MainContext)
  const showFriendBadges = context.config.isEventFriendBadgesEnabled !== false
  const showSelf = context.config.isEventSelfIconEnabled !== false
  const username = context.nyx?.username || context.nyx?.api.getAuth()?.username || ''
  const friends = friendAttendees(detail.attendees).map(friend => ({
    username: friend.username,
    attendance: friend.attendance_type === 'interested' ? ('interested' as const) : ('going' as const),
  }))
  const icons = eventIconRow(friends, { username, attendance: detail.myAttendance }, showSelf).icons
  const shownIcons = icons.slice(0, 4)
  const openAttendees = () => {
    const request = ++attendeesRequest.current
    setIsAttendeesOpen(true)
    if (!onReloadAttendees) {
      return
    }
    setIsAttendeesLoading(true)
    Promise.resolve(onReloadAttendees()).finally(() => {
      if (request === attendeesRequest.current) {
        setIsAttendeesLoading(false)
      }
    })
  }

  return (
    <View>
      <View style={{ paddingTop: blocks.small }}>
        {(!!detail.owner || !!when || !!place) && (
          <View style={[rowStyle, { flexDirection: 'row', alignItems: 'center' }]}>
            {!!detail.owner && (
              <UserIconComponent username={detail.owner} width={ICON_W} height={ICON_H} marginRight={blocks.medium} />
            )}
            {!!detail.owner && (
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.faded, fontSize: fontSizes.small }}>{t('events.hostedBy')}</Text>
                <Text numberOfLines={1} style={{ color: colors.text, fontSize: fontSizes.p, fontWeight: '700' }}>
                  {detail.owner}
                </Text>
              </View>
            )}
            {(!!when || !!place) && (
              <View style={{ flex: 1, alignItems: 'flex-end', marginLeft: detail.owner ? blocks.small : 0 }}>
                {!!when && (
                  <Text style={{ color: colors.text, fontSize: fontSizes.small, textAlign: 'right' }}>{when}</Text>
                )}
                {!!place && (
                  <Text
                    style={{
                      color: colors.faded,
                      fontSize: fontSizes.small,
                      textAlign: 'right',
                      marginTop: when ? 2 : 0,
                    }}>
                    {place}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        <TouchableRipple rippleColor={colors.ripple} onPress={openAttendees}>
          <View style={[rowStyle, { flexDirection: 'row', alignItems: 'center' }]}>
            <View
              style={{
                width: ICON_W,
                height: ICON_H,
                marginRight: blocks.medium,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.background,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSizes.small }}>{total}</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ color: colors.text, fontSize: fontSizes.small }}>
                {detail.going || 0} {t('events.going')}
              </Text>
              <Text style={{ color: colors.text, fontSize: fontSizes.small, marginTop: 2 }}>
                {detail.interested || 0} {t('events.interested')}
              </Text>
            </View>
            {shownIcons.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: blocks.small }}>
                {shownIcons.map(icon => (
                  <UserIconComponent
                    key={`${icon.isSelf ? 'me' : 'friend'}-${icon.username}`}
                    username={icon.username}
                    width={26}
                    height={32}
                    marginLeft={4}
                    attendance={
                      showFriendBadges && (icon.attendance === 'going' || icon.attendance === 'interested')
                        ? icon.attendance
                        : null
                    }
                  />
                ))}
                {icons.length > shownIcons.length && (
                  <Text style={{ color: colors.faded, fontSize: fontSizes.small, marginLeft: 4 }}>
                    +{icons.length - shownIcons.length}
                  </Text>
                )}
              </View>
            )}
          </View>
        </TouchableRipple>
        <View style={[rowStyle, { flexDirection: 'row', paddingVertical: 0, paddingHorizontal: 0 }]}>
          {RSVP.map((attendance, index) => {
            const selected = detail.myAttendance === attendance
            return (
              <TouchableRipple
                key={attendance}
                disabled={isAttendanceSaving}
                rippleColor={colors.ripple}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: !!isAttendanceSaving }}
                onPress={() => {
                  if (selected) {
                    return
                  }
                  onAttendance(attendance)
                }}
                style={{
                  flex: 1,
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: blocks.medium,
                  paddingHorizontal: 4,
                  backgroundColor: selected ? colors.card : colors.transparent,
                  borderRightWidth: index < RSVP.length - 1 ? 1 : 0,
                  borderColor: colors.border,
                }}>
                <Text
                  numberOfLines={2}
                  style={{
                    color: selected ? colors.text : colors.faded,
                    fontSize: fontSizes.small,
                    fontWeight: selected ? '700' : '400',
                    textAlign: 'center',
                  }}>
                  {t(`events.rsvp.${attendance}`)}
                </Text>
              </TouchableRipple>
            )
          })}
        </View>
      </View>
      {!!detail.name && (
        <Text
          style={{
            color: colors.accent,
            fontSize: fontSizes.p * 1.15,
            fontWeight: '700',
            paddingHorizontal: blocks.medium,
            marginTop: blocks.medium,
          }}>
          {detail.name}
        </Text>
      )}
      <EventBody
        parsed={detail.parsed}
        imageWidth={imageWidth}
        images={detail.images}
        onImage={onImage}
        onOpenDiscussion={onOpenDiscussion}
      />
      <AttendeesDialog
        visible={isAttendeesOpen}
        attendees={detail.attendees}
        isLoading={isAttendeesLoading}
        username={username}
        onDismiss={() => {
          attendeesRequest.current += 1
          setIsAttendeesOpen(false)
          setIsAttendeesLoading(false)
        }}
      />
    </View>
  )
}

const AttendeesDialog = ({
  visible,
  attendees,
  isLoading,
  username,
  onDismiss,
}: {
  visible: boolean
  attendees: EventAttendee[]
  isLoading?: boolean
  username?: string
  onDismiss: () => void
}) => {
  const theme = useTheme()
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = theme
  const mine = (username || '').trim().toLowerCase()
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.ScrollArea style={{ paddingLeft: 5, paddingRight: 5 }}>
          <ScrollView style={{ marginVertical: 5 }}>
            <View
              style={[
                Styling.groups.flexRowSpbCentered,
                { paddingHorizontal: blocks.small, minHeight: fontSizes.h1 },
              ]}>
              <Text style={{ fontSize: fontSizes.p }}>{t('events.attendees')}</Text>
              <Text style={{ fontSize: fontSizes.p }}>{isLoading ? '' : attendees.length}</Text>
            </View>
            {isLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: blocks.large }} />}
            {!isLoading && attendees.length === 0 && (
              <Text
                style={{
                  color: colors.faded,
                  fontSize: fontSizes.p,
                  marginTop: blocks.small,
                  paddingHorizontal: blocks.small,
                }}>
                {t('events.nobody')}
              </Text>
            )}
            {!isLoading &&
              attendees.map(attendee => {
                const marked = attendee.is_friend || (mine.length > 0 && attendee.username.toLowerCase() === mine)
                return (
                  <UserRowComponent
                    key={attendee.username}
                    user={attendee}
                    theme={theme}
                    isPressable={false}
                    marginBottom={0}
                    marginTop={blocks.small}
                    borderLeftWidth={3}
                    borderColor={marked ? colors.primary : colors.transparent}
                    extra={
                      <Icon
                        name={attendee.attendance_type === 'going' ? 'user' : 'eye'}
                        size={fontSizes.p}
                        color={colors.accent}
                      />
                    }
                  />
                )
              })}
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
  const selectable = isTextSelectionEnabled(useContext(MainContext).config)
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
            selectable={selectable}
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
