import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Text } from 'react-native-paper'
import { LlmPendingTask, Styling, t, useTheme } from '../../lib'
import { ButtonComponent } from '../ButtonComponent'

type Props = {
  task: LlmPendingTask
  onRetry?: (taskId: string) => void
  onDismiss?: (taskId: string) => void
}

export const LlmPendingItemCard: React.FC<Props> = ({ task, onRetry, onDismiss }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const [seconds, setSeconds] = useState(Math.max(0, Math.floor((Date.now() - task.startedAt) / 1000)))

  useEffect(() => {
    if (task.status !== 'pending') {
      return
    }
    const interval = setInterval(() => {
      setSeconds(Math.max(0, Math.floor((Date.now() - task.startedAt) / 1000)))
    }, 1000)
    return () => clearInterval(interval)
  }, [task.startedAt, task.status])

  const isError = task.status === 'error'
  const actions = [
    onDismiss && { key: 'dismiss', label: t('llm.cancel'), color: colors.faded, onPress: () => onDismiss(task.id) },
    isError &&
      onRetry && { key: 'retry', label: t('llm.retry'), color: colors.accent, onPress: () => onRetry(task.id) },
  ].filter(Boolean) as { key: string; label: string; color: string; onPress: () => void }[]

  return (
    <View style={{ marginBottom: blocks.small }}>
      <View
        style={{
          backgroundColor: colors.row,
          borderLeftWidth: 3,
          borderColor: isError ? colors.error : colors.primary,
          paddingHorizontal: blocks.medium,
          paddingVertical: blocks.medium,
        }}>
        <View style={Styling.groups.flexRowSpbCentered}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: fontSizes.p - 1, color: colors.text }}>
            {task.discussionTitle || `#${task.discussionId}`}
          </Text>
          {isError ? (
            <Text style={{ color: colors.error, fontSize: fontSizes.small, marginLeft: blocks.medium }}>
              {t('llm.error')}
            </Text>
          ) : (
            <View style={[Styling.groups.flexRowCentered, { marginLeft: blocks.medium }]}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: blocks.small }} />
              <Text style={{ color: colors.faded, fontSize: fontSizes.small }}>{`${seconds} s`}</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} style={{ color: colors.faded, fontSize: fontSizes.small, marginTop: 2 }}>
          {task.prompt}
        </Text>
        {isError && !!task.error && (
          <Text selectable style={{ color: colors.error, fontSize: fontSizes.small, marginTop: blocks.small }}>
            {task.error}
          </Text>
        )}
      </View>
      {actions.length > 0 && (
        <View style={{ flexDirection: 'row' }}>
          {actions.map(action => (
            <ButtonComponent
              key={action.key}
              label={action.label}
              color={action.color}
              fontSize={fontSizes.p}
              lineHeight={40}
              width={`${100 / actions.length}%`}
              onPress={action.onPress}
            />
          ))}
        </View>
      )}
    </View>
  )
}
