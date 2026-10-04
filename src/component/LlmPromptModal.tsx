import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import Icon from 'react-native-vector-icons/Feather'
import {
  filterAndFormatPostsForLlm,
  isoDate,
  sendOpenRouterChat,
  t,
  useTheme,
} from '../lib'

type Props = {
  isVisible: boolean
  discussionId: number | string
  discussionTitle: string
  posts: any[]
  apiKey: string
  modelId: string
  modelName?: string
  onClose: () => void
  onLoadMorePosts?: () => Promise<number>
}

type DatePreset = 'today' | 'yesterday' | '3days' | 'week' | 'all' | 'custom'

export const LlmPromptModal: React.FC<Props> = ({
  isVisible,
  discussionId,
  discussionTitle,
  posts,
  apiKey,
  modelId,
  modelName,
  onClose,
  onLoadMorePosts,
}) => {
  const theme = useTheme()
  const { colors, metrics } = theme

  const [prompt, setPrompt] = useState('')
  const [datePreset, setDatePreset] = useState<DatePreset>('today')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [resultUsage, setResultUsage] = useState<any | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Initialize dates to "today" when opened
  useEffect(() => {
    if (isVisible) {
      applyPreset('today')
      setErrorMessage(null)
      setResult(null)
      setResultUsage(null)
      setCopied(false)
    }
  }, [isVisible])

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset)
    const now = new Date()
    const todayStr = isoDate(now)

    if (preset === 'today') {
      setDateFrom(todayStr)
      setDateTo(todayStr)
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      setDateFrom(isoDate(yesterday))
      setDateTo(todayStr)
    } else if (preset === '3days') {
      const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)
      setDateFrom(isoDate(threeDaysAgo))
      setDateTo(todayStr)
    } else if (preset === 'week') {
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      setDateFrom(isoDate(weekAgo))
      setDateTo(todayStr)
    } else if (preset === 'all') {
      setDateFrom('')
      setDateTo('')
    }
  }

  // Filtered posts stats
  const { count: postCount, wordCount } = useMemo(
    () => filterAndFormatPostsForLlm(posts, dateFrom, dateTo, discussionTitle),
    [posts, dateFrom, dateTo, discussionTitle],
  )

  // Check if oldest loaded post is newer than dateFrom
  const canLoadOlder = useMemo(() => {
    if (!onLoadMorePosts || !dateFrom) {
      return false
    }
    const validPosts = posts.filter(p => p && p.inserted_at && p.location !== 'header')
    if (validPosts.length === 0) {
      return false
    }
    // Posts are usually newest first, so oldest is at the end
    const oldest = validPosts[validPosts.length - 1]
    const oldestDay = oldest.inserted_at.substring(0, 10)
    return oldestDay > dateFrom
  }, [posts, dateFrom, onLoadMorePosts])

  const handleLoadOlder = async () => {
    if (!onLoadMorePosts || isLoadingOlder) {
      return
    }
    setIsLoadingOlder(true)
    setErrorMessage(null)
    try {
      await onLoadMorePosts()
    } catch (e: any) {
      setErrorMessage(e?.message || 'Chyba při načítání starších příspěvků.')
    } finally {
      setIsLoadingOlder(false)
    }
  }

  const handleSend = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Zadej instrukci (prompt) pro model.')
      return
    }
    if (postCount === 0) {
      setErrorMessage('Ve vybraném období nejsou žádné příspěvky ke zpracování.')
      return
    }

    setIsSending(true)
    setErrorMessage(null)
    setResult(null)
    setResultUsage(null)
    setCopied(false)

    try {
      const res = await sendOpenRouterChat({
        apiKey,
        model: modelId,
        userPrompt: prompt,
        discussionTitle,
        posts,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setResult(res.content)
      setResultUsage(res.usage)
    } catch (e: any) {
      setErrorMessage(e?.message || 'Nastala neočekávaná chyba při komunikaci s modelem.')
    } finally {
      setIsSending(false)
    }
  }

  const handleCopy = () => {
    if (!result) {
      return
    }
    Clipboard.setString(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (!isVisible) {
    return null
  }

  const presetChips: { key: DatePreset; label: string }[] = [
    { key: 'today', label: t('llm.today') || 'Dnes' },
    { key: 'yesterday', label: t('llm.yesterdayAndToday') || 'Včera a dnes' },
    { key: '3days', label: t('llm.last3Days') || '3 dny' },
    { key: 'week', label: t('llm.lastWeek') || 'Týden' },
    { key: 'all', label: t('llm.allLoaded') || 'Vše načtené' },
  ]

  const promptSuggestions = [
    {
      label: t('llm.presetSummary') || 'Shrnutí diskuze',
      text: 'Udělej mi věcné a přehledné shrnutí této části diskuze. Zmiň hlavní témata a klíčové závěry.',
    },
    {
      label: t('llm.presetTopics') || 'Klíčová témata',
      text: 'Vypiš v bodech hlavní témata, o kterých se v diskuzi mluvilo, a případné sporné body.',
    },
    {
      label: t('llm.presetDebate') || 'Názory diskutujících',
      text: 'Shrň, jaké postoje a argumenty vyjadřovali jednotliví diskutující (@autoři) k probíraným tématům.',
    },
  ]

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.disabled }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="x" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.text, fontSize: metrics.fontSizes.h2 }]}>
              {t('llm.title') || 'LLM Asistent'}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.faded, fontSize: metrics.fontSizes.small }]}
              numberOfLines={1}>
              {discussionTitle ? `${discussionTitle} • ` : ''}
              {modelName || modelId}
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Prompt Section */}
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: metrics.fontSizes.p }]}>
              {t('llm.promptLabel') || 'Co chceš s příspěvky udělat?'}
            </Text>

            {/* Quick Prompt Suggestions */}
            <View style={styles.chipsRow}>
              {promptSuggestions.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setPrompt(s.text)}
                  style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
                  <Text style={{ color: colors.primary, fontSize: metrics.fontSizes.small, fontWeight: '500' }}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Prompt Textarea */}
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={4}
              placeholder={
                t('llm.promptPlaceholder') ||
                'Např. Udělej mi stručný souhrn diskuze, vypiš klíčové body a neshody...'
              }
              placeholderTextColor={colors.faded}
              style={[
                styles.textarea,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.disabled,
                  fontSize: metrics.fontSizes.p,
                },
              ]}
            />

            {/* Date Range Section */}
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontSize: metrics.fontSizes.p, marginTop: 16 },
              ]}>
              {t('llm.dateRange') || 'Období příspěvků'}
            </Text>

            {/* Quick Date Chips */}
            <View style={styles.chipsRow}>
              {presetChips.map(chip => {
                const isSelected = datePreset === chip.key
                return (
                  <TouchableOpacity
                    key={chip.key}
                    onPress={() => applyPreset(chip.key)}
                    style={[
                      styles.dateChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.disabled,
                      },
                    ]}>
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: metrics.fontSizes.small,
                        fontWeight: isSelected ? 'bold' : 'normal',
                      }}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Custom Date Inputs (Od - Do) */}
            <View style={styles.dateInputsRow}>
              <View style={styles.dateInputWrap}>
                <Text style={[styles.dateInputLabel, { color: colors.faded, fontSize: metrics.fontSizes.small }]}>
                  {t('llm.dateFrom') || 'Od'} (RRRR-MM-DD):
                </Text>
                <TextInput
                  value={dateFrom}
                  onChangeText={val => {
                    setDateFrom(val)
                    setDatePreset('custom')
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.faded}
                  style={[
                    styles.dateInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.surface,
                      borderColor: colors.disabled,
                      fontSize: metrics.fontSizes.p,
                    },
                  ]}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.dateInputWrap}>
                <Text style={[styles.dateInputLabel, { color: colors.faded, fontSize: metrics.fontSizes.small }]}>
                  {t('llm.dateTo') || 'Do'} (RRRR-MM-DD):
                </Text>
                <TextInput
                  value={dateTo}
                  onChangeText={val => {
                    setDateTo(val)
                    setDatePreset('custom')
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.faded}
                  style={[
                    styles.dateInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.surface,
                      borderColor: colors.disabled,
                      fontSize: metrics.fontSizes.p,
                    },
                  ]}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Matching Stats & Load Older Button */}
            <View style={[styles.statsBox, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
              <View style={styles.statsRow}>
                <Icon
                  name={postCount > 0 ? 'check-circle' : 'alert-circle'}
                  size={16}
                  color={postCount > 0 ? colors.secondary : colors.accent}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: postCount > 0 ? colors.text : colors.faded,
                    fontSize: metrics.fontSizes.small,
                    flex: 1,
                  }}>
                  {postCount > 0
                    ? `Nalezeno ${postCount} příspěvků (cca ${wordCount.toLocaleString()} slov)`
                    : 'Ve vybraném období nebyly nalezeny žádné příspěvky.'}
                </Text>
              </View>

              {canLoadOlder && (
                <TouchableOpacity
                  onPress={handleLoadOlder}
                  disabled={isLoadingOlder}
                  style={[styles.loadOlderBtn, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
                  {isLoadingOlder ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Icon name="arrow-down" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={{ color: colors.primary, fontSize: metrics.fontSizes.small, fontWeight: '500' }}>
                        {t('llm.loadOlderPosts') || 'Načíst starší příspěvky z diskuze'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View style={[styles.errorBox, { backgroundColor: `${colors.accent}18`, borderColor: colors.accent }]}>
                <Icon name="alert-triangle" size={18} color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.accent, fontSize: metrics.fontSizes.small, flex: 1 }}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={isSending || postCount === 0 || !prompt.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor:
                    isSending || postCount === 0 || !prompt.trim() ? colors.disabled : colors.primary,
                },
              ]}>
              {isSending ? (
                <View style={styles.sendingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.sendBtnText}>{t('llm.sending') || 'Zpracovávám...'}</Text>
                </View>
              ) : (
                <View style={styles.sendingRow}>
                  <Icon name="cpu" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.sendBtnText}>{t('llm.send') || 'Odeslat dotaz'}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Response Section */}
            {result && (
              <View style={[styles.resultBox, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
                <View style={styles.resultHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="message-square" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.resultTitle, { color: colors.text, fontSize: metrics.fontSizes.p }]}>
                      Odpověď modelu
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleCopy}
                    style={[
                      styles.copyBtn,
                      { backgroundColor: copied ? colors.secondary : colors.primary },
                    ]}>
                    <Icon name={copied ? 'check' : 'copy'} size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.copyBtnText}>
                      {copied ? t('llm.copied') || 'Zkopírováno' : t('llm.copyAnswer') || 'Kopírovat'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  selectable
                  style={[styles.resultText, { color: colors.text, fontSize: metrics.fontSizes.p }]}>
                  {result}
                </Text>

                {resultUsage && (
                  <View style={[styles.usageRow, { borderTopColor: colors.disabled }]}>
                    <Text style={{ color: colors.faded, fontSize: 11 }}>
                      {`Tokeny: ${resultUsage.total_tokens || 0} celkem (${resultUsage.prompt_tokens || 0} prompt, ${
                        resultUsage.completion_tokens || 0
                      } výstup)`}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    gap: 6,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateInputWrap: {
    flex: 1,
  },
  dateInputLabel: {
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statsBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadOlderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  sendBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  resultBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultTitle: {
    fontWeight: 'bold',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resultText: {
    lineHeight: 22,
  },
  usageRow: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
