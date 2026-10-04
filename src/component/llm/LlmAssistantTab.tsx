import React, { useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import {
  addLlmHistoryEntry,
  filterAndFormatPostsForLlm,
  sendOpenRouterChat,
  Storage,
  t,
  useTheme,
} from '../../lib'
import { LlmDateFilterBar } from './LlmDateFilterBar'
import { LlmModelBar } from './LlmModelBar'
import { LlmPromptInput } from './LlmPromptInput'
import { LlmResultSection } from './LlmResultSection'
import { useLlmDateFilter } from './useLlmDateFilter'

type Props = {
  discussionId: number | string
  discussionTitle: string
  posts: any[]
  apiKey: string
  defaultModelId: string
  defaultModelName?: string
  systemPrompt?: string
  prompt: string
  onChangePrompt: (val: string) => void
  onLoadMorePosts?: () => Promise<number>
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
  onHistoryEntryAdded?: () => void
}

export const LlmAssistantTab: React.FC<Props> = ({
  discussionId,
  discussionTitle,
  posts,
  apiKey,
  defaultModelId,
  defaultModelName,
  systemPrompt,
  prompt,
  onChangePrompt,
  onLoadMorePosts,
  onNavigateToPost,
  onHistoryEntryAdded,
}) => {
  const { colors, metrics } = useTheme()
  const { datePreset, dateFrom, dateTo, setDateFrom, setDateTo, applyPreset } = useLlmDateFilter()
  const [currentModelId, setCurrentModelId] = useState(defaultModelId)
  const [currentModelName, setCurrentModelName] = useState(defaultModelName || defaultModelId)
  const [isGlobalModel, setIsGlobalModel] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [resultUsage, setResultUsage] = useState<any | null>(null)
  const [resultDuration, setResultDuration] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [waitLog, setWaitLog] = useState<string | null>(null)
  const tickerRef = useRef<NodeJS.Timeout | null>(null)

  const { count: postCount, wordCount } = useMemo(
    () => filterAndFormatPostsForLlm(posts, dateFrom, dateTo, discussionTitle),
    [posts, dateFrom, dateTo, discussionTitle],
  )

  const canLoadOlder = useMemo(() => {
    if (!onLoadMorePosts || !dateFrom) {
      return false
    }
    const valid = posts.filter(p => p && p.inserted_at && p.location !== 'header')
    return valid.length > 0 && valid[valid.length - 1].inserted_at.substring(0, 10) > dateFrom
  }, [posts, dateFrom, onLoadMorePosts])

  const handleLoadOlder = async () => {
    if (!onLoadMorePosts || isLoadingOlder) {
      return
    }
    setIsLoadingOlder(true)
    try {
      await onLoadMorePosts()
    } catch (e: any) {
      setErrorMessage(e?.message || 'Chyba při načítání starších příspěvků.')
    } finally {
      setIsLoadingOlder(false)
    }
  }

  const handleSend = async () => {
    if (!prompt.trim() || postCount === 0 || !currentModelId) {
      return
    }
    setIsSending(true)
    setErrorMessage(null)
    setResult(null)
    const startTime = Date.now()
    setWaitLog('Odesílám dotaz...')
    tickerRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - startTime) / 1000)
      setWaitLog(`Čekám na odpověď od modelu (${sec}s)...`)
    }, 1000)

    try {
      if (isGlobalModel) {
        const conf = (await Storage.getConfig()) || {}
        conf.selectedLlmModel = currentModelId
        conf.selectedLlmModelName = currentModelName
        await Storage.setConfig(conf)
      }
      const res = await sendOpenRouterChat({
        apiKey,
        model: currentModelId,
        userPrompt: prompt,
        discussionId,
        discussionTitle,
        posts,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        systemPrompt,
      })
      const durationMs = Date.now() - startTime
      if (tickerRef.current) {
        clearInterval(tickerRef.current)
      }
      setWaitLog(null)
      setResult(res.content)
      setResultUsage(res.usage)
      setResultDuration(durationMs)
      await addLlmHistoryEntry({
        discussionId,
        discussionTitle,
        modelId: currentModelId,
        modelName: currentModelName,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        postCount,
        prompt: prompt.trim(),
        response: res.content,
        durationMs,
        usage: res.usage,
      })
      onHistoryEntryAdded?.()
    } catch (e: any) {
      if (tickerRef.current) {
        clearInterval(tickerRef.current)
      }
      setWaitLog(null)
      setErrorMessage(e?.message || 'Chyba při komunikaci s modelem.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <View style={styles.tabContent}>
      <LlmModelBar
        apiKey={apiKey}
        currentModelId={currentModelId}
        currentModelName={currentModelName}
        isGlobalModel={isGlobalModel}
        onModelSelected={m => {
          setCurrentModelId(m.id)
          setCurrentModelName(m.name)
        }}
        onToggleGlobal={setIsGlobalModel}
      />

      <LlmDateFilterBar
        datePreset={datePreset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPresetChange={applyPreset}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
        <Text style={{ color: colors.text, fontSize: metrics.fontSizes.small, flex: 1 }}>
          {postCount > 0 ? `${postCount} příspěvků (cca ${wordCount} slov)` : t('llm.noPosts') || 'Žádné příspěvky'}
        </Text>
        {canLoadOlder && (
          <TouchableOpacity onPress={handleLoadOlder} disabled={isLoadingOlder} style={styles.loadOlderBtn}>
            {isLoadingOlder ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: colors.primary, fontSize: metrics.fontSizes.small - 1, fontWeight: 'bold' }}>
                {t('llm.loadOlderPosts') || 'Načíst starší'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <LlmPromptInput prompt={prompt} onChangePrompt={onChangePrompt} disabled={isSending} />

      <TouchableOpacity
        onPress={handleSend}
        disabled={isSending || !prompt.trim() || postCount === 0}
        style={[
          styles.sendBtn,
          { backgroundColor: isSending || !prompt.trim() || postCount === 0 ? colors.disabled : colors.primary },
        ]}>
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
        ) : (
          <Icon name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
        )}
        <Text style={{ color: '#FFFFFF', fontSize: metrics.fontSizes.p, fontWeight: 'bold' }}>
          {isSending ? t('llm.sending') || 'Zpracovávám...' : t('llm.send') || 'Odeslat dotaz'}
        </Text>
      </TouchableOpacity>

      {!!waitLog && (
        <View style={[styles.waitLogWrap, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.text, fontSize: metrics.fontSizes.small }}>{waitLog}</Text>
        </View>
      )}

      {!!errorMessage && (
        <View style={[styles.errorWrap, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
          <Icon name="alert-triangle" size={16} color={colors.accent} style={{ marginRight: 8 }} />
          <Text selectable style={{ color: colors.text, fontSize: metrics.fontSizes.small, flex: 1 }}>
            {errorMessage}
          </Text>
        </View>
      )}

      {!!result && (
        <LlmResultSection
          result={result}
          usage={resultUsage}
          durationMs={resultDuration}
          onNewQuery={() => setResult(null)}
          onNavigateToPost={onNavigateToPost}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tabContent: { paddingBottom: 24 },
  statsRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  loadOlderBtn: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, marginTop: 4 },
  waitLogWrap: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 10 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 10 },
})
