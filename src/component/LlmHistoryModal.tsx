import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import Icon from 'react-native-vector-icons/Feather'
import {
  clearLlmHistory,
  deleteLlmHistoryEntry,
  getLlmHistory,
  LlmHistoryItem,
  t,
  useTheme,
} from '../lib'

type Props = {
  isVisible: boolean
  onClose: () => void
  onHistoryChanged?: () => void
}

export const LlmHistoryModal: React.FC<Props> = ({
  isVisible,
  onClose,
  onHistoryChanged,
}) => {
  const theme = useTheme()
  const { colors, metrics } = theme

  const [history, setHistory] = useState<LlmHistoryItem[]>([])
  const [search, setSearch] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null)

  const load = useCallback(async () => {
    const list = await getLlmHistory()
    setHistory(list)
  }, [])

  useEffect(() => {
    if (isVisible) {
      load()
      setSearch('')
      setConfirmDeleteId(null)
      setConfirmClearAll(false)
      setCopiedId(null)
    }
  }, [isVisible, load])

  const handleDeleteItem = async (id: string) => {
    if (confirmDeleteId === id) {
      // 2nd tap -> execute delete
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }
      setConfirmDeleteId(null)
      const updated = await deleteLlmHistoryEntry(id)
      setHistory(updated)
      onHistoryChanged?.()
    } else {
      // 1st tap -> arm confirmation
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }
      setConfirmDeleteId(id)
      deleteTimerRef.current = setTimeout(() => {
        setConfirmDeleteId(null)
      }, 3000)
    }
  }

  const handleClearAll = async () => {
    if (confirmClearAll) {
      // 2nd tap -> clear all
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
      setConfirmClearAll(false)
      await clearLlmHistory()
      setHistory([])
      onHistoryChanged?.()
    } else {
      // 1st tap -> arm confirmation
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
      setConfirmClearAll(true)
      clearTimerRef.current = setTimeout(() => {
        setConfirmClearAll(false)
      }, 3000)
    }
  }

  const handleCopy = (id: string, text: string) => {
    Clipboard.setString(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredHistory = useMemo(() => {
    if (!search.trim()) {
      return history
    }
    const q = search.trim().toLowerCase()
    return history.filter(
      item =>
        (item.discussionTitle && item.discussionTitle.toLowerCase().includes(q)) ||
        (item.prompt && item.prompt.toLowerCase().includes(q)) ||
        (item.response && item.response.toLowerCase().includes(q)) ||
        (item.modelName && item.modelName.toLowerCase().includes(q)) ||
        (item.modelId && item.modelId.toLowerCase().includes(q)),
    )
  }, [history, search])

  if (!isVisible) {
    return null
  }

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
              {t('profile.llm.history') || 'Historie LLM dotazů'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.faded, fontSize: metrics.fontSizes.small }]}>
              {`${filteredHistory.length} z ${history.length} dotazů`}
            </Text>
          </View>

          {history.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={[
                styles.clearAllBtn,
                {
                  backgroundColor: confirmClearAll ? colors.accent : colors.surface,
                  borderColor: confirmClearAll ? colors.accent : colors.disabled,
                },
              ]}>
              <Icon
                name={confirmClearAll ? 'alert-triangle' : 'trash-2'}
                size={14}
                color={confirmClearAll ? '#FFFFFF' : colors.accent}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  color: confirmClearAll ? '#FFFFFF' : colors.accent,
                  fontSize: metrics.fontSizes.small,
                  fontWeight: confirmClearAll ? 'bold' : 'normal',
                }}>
                {confirmClearAll ? 'Opravdu smazat vše?' : 'Smazat vše'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        {history.length > 0 && (
          <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
            <Icon name="search" size={18} color={colors.faded} style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Hledat v dotazech nebo odpovědích..."
              placeholderTextColor={colors.faded}
              style={[styles.searchInput, { color: colors.text, fontSize: metrics.fontSizes.p }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="x-circle" size={18} color={colors.faded} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* List of items */}
        <FlatList
          data={filteredHistory}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const isDeleting = confirmDeleteId === item.id
            const isCopied = copiedId === item.id
            const isExpanded = !!expandedIds[item.id]
            const isLongText = item.response && item.response.length > 350

            const dateRangeLabel =
              item.dateFrom && item.dateTo
                ? `${item.dateFrom} – ${item.dateTo}`
                : item.dateFrom
                ? `od ${item.dateFrom}`
                : item.dateTo
                ? `do ${item.dateTo}`
                : 'celá načtená diskuze'

            return (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.disabled },
                ]}>
                {/* Card Top Row: Discussion Title & 2-tap Delete */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={[
                        styles.cardDiscussionTitle,
                        { color: colors.text, fontSize: metrics.fontSizes.p },
                      ]}
                      numberOfLines={1}>
                      {item.discussionTitle || `Klub #${item.discussionId}`}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.cardDate, { color: colors.faded, fontSize: metrics.fontSizes.small }]}>
                        {item.createdAt}
                      </Text>
                      {item.modelName || item.modelId ? (
                        <View style={[styles.modelBadge, { backgroundColor: colors.background }]}>
                          <Text style={{ color: colors.faded, fontSize: 10 }}>
                            {item.modelName || item.modelId}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Double-tap Delete Button */}
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.id)}
                    style={[
                      styles.itemDeleteBtn,
                      {
                        backgroundColor: isDeleting ? colors.accent : colors.background,
                        borderColor: isDeleting ? colors.accent : colors.disabled,
                      },
                    ]}>
                    <Icon
                      name={isDeleting ? 'check' : 'trash-2'}
                      size={14}
                      color={isDeleting ? '#FFFFFF' : colors.accent}
                      style={{ marginRight: isDeleting ? 4 : 0 }}
                    />
                    {isDeleting && (
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                        Smazat?
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Period & post count info */}
                <View style={styles.periodRow}>
                  <Icon name="calendar" size={13} color={colors.faded} style={{ marginRight: 5 }} />
                  <Text style={{ color: colors.faded, fontSize: metrics.fontSizes.small }}>
                    {`${dateRangeLabel} (${item.postCount || 0} příspěvků)`}
                  </Text>
                </View>

                {/* Prompt Box */}
                <View style={[styles.promptBox, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
                  <Text style={[styles.promptLabel, { color: colors.primary, fontSize: 11 }]}>
                    ZADÁNÍ (PROMPT):
                  </Text>
                  <Text style={[styles.promptText, { color: colors.text, fontSize: metrics.fontSizes.p }]}>
                    {item.prompt}
                  </Text>
                </View>

                {/* Response Box */}
                <View style={styles.responseContainer}>
                  <View style={styles.responseHeaderRow}>
                    <Text style={[styles.responseLabel, { color: colors.faded, fontSize: 11 }]}>
                      ODPOVĚĎ:
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleCopy(item.id, item.response)}
                      style={[
                        styles.copyBtn,
                        { backgroundColor: isCopied ? colors.secondary : colors.primary },
                      ]}>
                      <Icon
                        name={isCopied ? 'check' : 'copy'}
                        size={12}
                        color="#FFFFFF"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.copyBtnText}>
                        {isCopied ? 'Zkopírováno' : 'Kopírovat'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text
                    selectable
                    style={[styles.responseText, { color: colors.text, fontSize: metrics.fontSizes.p }]}>
                    {isLongText && !isExpanded
                      ? `${item.response.substring(0, 320)}...`
                      : item.response}
                  </Text>

                  {isLongText && (
                    <TouchableOpacity
                      onPress={() => toggleExpand(item.id)}
                      style={styles.expandToggle}>
                      <Text style={{ color: colors.primary, fontSize: metrics.fontSizes.small, fontWeight: '600' }}>
                        {isExpanded ? 'Zobrazit méně ▲' : 'Zobrazit celou odpověď ▼'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Usage Footer */}
                {item.usage && (
                  <View style={[styles.cardFooter, { borderTopColor: colors.disabled }]}>
                    <Text style={{ color: colors.faded, fontSize: 11 }}>
                      {`Tokeny: ${item.usage.total_tokens || 0} celkem (${item.usage.prompt_tokens || 0} vstup, ${
                        item.usage.completion_tokens || 0
                      } výstup)`}
                    </Text>
                  </View>
                )}
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="archive" size={48} color={colors.faded} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.text, fontSize: metrics.fontSizes.h3, fontWeight: '600', marginBottom: 4 }}>
                {search.trim().length > 0
                  ? 'Žádný záznam neodpovídá hledání'
                  : 'Zatím žádná historie dotazů'}
              </Text>
              <Text style={{ color: colors.faded, fontSize: metrics.fontSizes.small, textAlign: 'center', paddingHorizontal: 20 }}>
                {search.trim().length > 0
                  ? 'Zkuste zadat jiný výraz pro vyhledání.'
                  : 'Když odešlete dotaz LLM asistentovi v libovolné diskuzi, uloží se automaticky sem pro pozdější nahlédnutí.'}
              </Text>
            </View>
          }
        />
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
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardDiscussionTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  cardDate: {
    marginRight: 4,
  },
  modelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  promptBox: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  promptLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  promptText: {
    fontStyle: 'italic',
  },
  responseContainer: {
    marginBottom: 6,
  },
  responseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  responseLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  responseText: {
    lineHeight: 21,
  },
  expandToggle: {
    marginTop: 6,
    paddingVertical: 4,
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
