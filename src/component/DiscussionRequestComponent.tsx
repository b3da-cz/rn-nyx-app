import React, { useContext, useState } from 'react'
import { View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { discussionRequestFromPost, isTextSelectionEnabled, MainContext, t, useTheme } from '../lib'
import type { DiscussionRequestLink, DiscussionRequestView } from '../lib'

type Props = {
  request: DiscussionRequestView
  onVote: (against: boolean) => Promise<any>
  onOpenDiscussion?: (discussionId: number) => void
}

export const DiscussionRequestComponent = ({ request, onVote, onOpenDiscussion }: Props) => {
  const [shown, setShown] = useState<DiscussionRequestView | null>(null)
  const [seen, setSeen] = useState(request)
  const [busy, setBusy] = useState(false)
  if (
    request.canVote !== seen.canVote ||
    request.votesFor !== seen.votesFor ||
    request.votesAgainst !== seen.votesAgainst ||
    request.discussionId !== seen.discussionId ||
    request.cancelled !== seen.cancelled
  ) {
    setSeen(request)
    setShown(null)
  }
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const selectable = isTextSelectionEnabled(useContext(MainContext).config)
  const view = shown || request
  const vote = async (against: boolean) => {
    if (busy) {
      return
    }
    setBusy(true)
    try {
      const updated = await onVote(against)
      const next = updated && !updated.error ? discussionRequestFromPost(updated) : null
      if (next) {
        setShown(next)
      }
    } finally {
      setBusy(false)
    }
  }
  const open = (id: number) => {
    if (onOpenDiscussion) {
      onOpenDiscussion(id)
    }
  }
  return (
    <View style={{ paddingHorizontal: blocks.medium, paddingBottom: blocks.medium }}>
      <Field label={t('discussionRequest.name')} value={view.name} selectable={selectable} onPress={view.discussionId ? () => open(view.discussionId as number) : undefined} />
      <Field label={t('discussionRequest.category')} value={view.category} selectable={selectable} />
      <Field label={t('discussionRequest.summary')} value={view.summary} selectable={selectable} />
      {!view.discussionId && (
        <Field label={t('discussionRequest.similar')} value={view.links.length ? '' : view.similar || '-'} selectable={selectable}>
          {view.links.map(link => (
            <LinkLine key={link.id} link={link} onPress={() => open(link.id)} />
          ))}
        </Field>
      )}
      <Text style={{ fontSize: fontSizes.p, fontWeight: 'bold', color: colors.text, marginTop: blocks.medium }}>
        {t('discussionRequest.vote')}
      </Text>
      {view.cancelled && (
        <Text selectable={selectable} style={{ color: colors.disabled, fontSize: fontSizes.p, marginTop: blocks.small }}>
          {t('discussionRequest.cancelled')}
        </Text>
      )}
      {view.canVote ? (
        <View style={{ flexDirection: 'row' }}>
          <VoteButton
            icon="thumbs-up"
            label={`${t('discussionRequest.for')}   ${view.votesFor}`}
            disabled={busy}
            onPress={() => vote(false)}
          />
          <View style={{ width: blocks.small }} />
          <VoteButton
            icon="thumbs-down"
            label={`${t('discussionRequest.against')}   ${view.votesAgainst}`}
            disabled={busy}
            onPress={() => vote(true)}
          />
        </View>
      ) : (
        <Text selectable={selectable} style={{ color: colors.text, fontSize: fontSizes.p, marginTop: blocks.small }}>
          {`${view.votesFor} ${t('discussionRequest.for').toLowerCase()}    ${view.votesAgainst} ${t('discussionRequest.against').toLowerCase()}`}
        </Text>
      )}
    </View>
  )
}

const VoteButton = ({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: string
  label: string
  disabled: boolean
  onPress: () => void
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes, line },
  } = useTheme()
  const color = disabled ? colors.disabled : colors.accent
  return (
    <TouchableRipple
      disabled={disabled}
      rippleColor={colors.ripple}
      onPress={onPress}
      style={{
        flex: 1,
        marginTop: blocks.medium,
        padding: blocks.large,
        borderWidth: line,
        borderRadius: 0,
        borderColor: color,
      }}>
      <Text style={{ fontSize: fontSizes.h3, color, textAlign: 'center' }}>
        <Icon name={icon} size={fontSizes.h3} color={color} />
        {`  ${label}`}
      </Text>
    </TouchableRipple>
  )
}

const Field = ({
  label,
  value,
  selectable,
  onPress,
  children,
}: {
  label: string
  value: string
  selectable: boolean
  onPress?: () => void
  children?: React.ReactNode
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <View style={{ marginTop: blocks.medium }}>
      <Text style={{ fontSize: fontSizes.p, fontWeight: 'bold', color: colors.text }}>{label}</Text>
      {!!value && (
        <Text
          selectable={onPress ? false : selectable}
          onPress={onPress}
          style={{
            fontSize: fontSizes.p,
            color: onPress ? colors.primary : colors.text,
            marginTop: 3,
          }}>
          {value}
        </Text>
      )}
      {children}
    </View>
  )
}

const LinkLine = ({ link, onPress }: { link: DiscussionRequestLink; onPress: () => void }) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  return (
    <Text onPress={onPress} style={{ fontSize: fontSizes.p, color: colors.primary, marginTop: 3 }}>
      {link.name}
    </Text>
  )
}
