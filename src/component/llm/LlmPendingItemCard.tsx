import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { LlmPendingTask, t, useTheme } from '../../lib'

type Props = {
  task: LlmPendingTask
  onRetry?: (taskId: string) => void
  onDismiss?: (taskId: string) => void
}

export const LlmPendingItemCard: React.FC<Props> = ({ task, onRetry, onDismiss }) => {
  const { colors, metrics } = useTheme()
  const [seconds, setSeconds] = useState(
    Math.max(0, Math.floor((Date.now() - task.startedAt) / 1000)),
  )

  useEffect(() => {
    if (task.status !== 'pending') return
    const interval = setInterval(() => {
      setSeconds(Math.max(0, Math.floor((Date.now() - task.startedAt) / 1000)))
    }, 1000)
    return () => clearInterval(interval)
  }, [task.startedAt, task.status])

  const isError = task.status === 'error'
  const accentBorderColor = isError ? colors.accent : colors.primary

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: accentBorderColor,
          borderLeftColor: accentBorderColor,
        },
      ]}>
      {/* Header: Discussion title and Loader + Seconds countdown */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: metrics.fontSizes.small, fontWeight: 'bold' }}>
            {task.discussionTitle || `Diskuze #${task.discussionId}`}
          </Text>
          <Text numberOfLines={1} style={{ color: colors.faded, fontSize: 10, marginTop: 1 }}>
            {task.modelName || task.modelId}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          {isError ? (
            <View style={styles.errorIndicator}>
              <Icon name="alert-triangle" size={14} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={{ color: colors.accent, fontSize: 11, fontWeight: 'bold' }}>Chyba</Text>
            </View>
          ) : (
            <View style={styles.runningIndicator}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                {`${seconds} s`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Prompt preview (non-clickable) */}
      <View style={styles.promptBox}>
        <Text style={{ color: accentBorderColor, fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>
          {isError ? 'PŘERUŠENÝ DOTAZ:' : 'PROBÍHAJÍCÍ DOTAZ:'}
        </Text>
        <Text numberOfLines={2} style={{ color: colors.text, fontSize: metrics.fontSizes.small - 1 }}>
          {task.prompt}
        </Text>
      </View>

      {/* Footer: Progress status or Error actions */}
      {isError ? (
        <View style={styles.errorFooter}>
          <Text style={{ color: colors.accent, fontSize: metrics.fontSizes.small - 1, flex: 1, marginRight: 8 }}>
            {task.error || 'Nastala chyba při zpracování dotazu.'}
          </Text>
          <View style={styles.actionButtons}>
            {!!onDismiss && (
              <TouchableOpacity
                onPress={() => onDismiss(task.id)}
                style={[styles.btn, { borderColor: colors.disabled }]}>
                <Text style={{ color: colors.faded, fontSize: 11 }}>Zrušit</Text>
              </TouchableOpacity>
            )}
            {!!onRetry && (
              <TouchableOpacity
                onPress={() => onRetry(task.id)}
                style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <Icon name="refresh-cw" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>Zkusit znovu</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.runningFooter}>
          <Text style={{ color: colors.faded, fontSize: 11, flex: 1 }}>
            Čekám na odpověď od modelu...
          </Text>
          {!!onDismiss && (
            <TouchableOpacity onPress={() => onDismiss(task.id)} style={styles.cancelBtn}>
              <Icon name="x" size={13} color={colors.faded} />
              <Text style={{ color: colors.faded, fontSize: 11, marginLeft: 2 }}>Zrušit</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptBox: {
    paddingVertical: 4,
    marginBottom: 4,
  },
  runningFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingTop: 4,
  },
  errorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    paddingTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
})
