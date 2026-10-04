import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { formatPricing, OpenRouterModel, RECOMMENDED_MODEL_IDS, Storage, useTheme } from '../lib'

type Props = {
  isVisible: boolean
  models: OpenRouterModel[]
  selectedModelId: string
  isLoading?: boolean
  onSelect: (model: OpenRouterModel) => void
  onCancel: () => void
}

type FilterCategory = 'favorites' | 'recommended' | 'all' | 'free' | 'google' | 'anthropic' | 'meta' | 'deepseek'

export const LlmModelPickerDialog: React.FC<Props> = ({
  isVisible,
  models,
  selectedModelId,
  isLoading = false,
  onSelect,
  onCancel,
}) => {
  const theme = useTheme()
  const { colors, metrics } = theme
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<FilterCategory>('recommended')
  const [favoriteModelIds, setFavoriteModelIds] = useState<string[]>([])

  React.useEffect(() => {
    if (isVisible) {
      Storage.getFavoriteLlmModels().then(favs => setFavoriteModelIds(favs || []))
    }
  }, [isVisible])

  const toggleFavorite = async (modelId: string) => {
    const isFav = favoriteModelIds.includes(modelId)
    const next = isFav ? favoriteModelIds.filter(id => id !== modelId) : [...favoriteModelIds, modelId]
    setFavoriteModelIds(next)
    await Storage.setFavoriteLlmModels(next)
  }

  const filteredModels = useMemo(() => {
    let list = models

    if (category === 'favorites') {
      list = list.filter(m => favoriteModelIds.includes(m.id))
    } else if (category === 'recommended') {
      list = list.filter(m => RECOMMENDED_MODEL_IDS.includes(m.id))
    } else if (category === 'free') {
      list = list.filter(m => {
        const p = parseFloat(m.pricing?.prompt || '0')
        const c = parseFloat(m.pricing?.completion || '0')
        return p === 0 && c === 0
      })
    } else if (category === 'google') {
      list = list.filter(m => m.id.startsWith('google/'))
    } else if (category === 'anthropic') {
      list = list.filter(m => m.id.startsWith('anthropic/'))
    } else if (category === 'meta') {
      list = list.filter(m => m.id.startsWith('meta-llama/'))
    } else if (category === 'deepseek') {
      list = list.filter(m => m.id.startsWith('deepseek/'))
    }

    if (search.trim().length > 0) {
      const q = search.trim().toLowerCase()
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
    }

    return list
  }, [models, category, search, favoriteModelIds])

  if (!isVisible) {
    return null
  }

  const categoryChips: { key: FilterCategory; label: string; icon?: string }[] = [
    { key: 'favorites', label: `Oblíbené (${favoriteModelIds.length})`, icon: 'star' },
    { key: 'recommended', label: 'Doporučené' },
    { key: 'all', label: 'Vše' },
    { key: 'free', label: 'Zdarma' },
    { key: 'google', label: 'Google' },
    { key: 'anthropic', label: 'Anthropic' },
    { key: 'deepseek', label: 'DeepSeek' },
    { key: 'meta', label: 'Meta Llama' },
  ]

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.disabled }]}>
          <TouchableOpacity onPress={onCancel} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.text, fontSize: metrics.fontSizes.h2 }]}>
              Výběr LLM modelu
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.faded, fontSize: metrics.fontSizes.small }]}>
              {`${filteredModels.length} z ${models.length} modelů`}
            </Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
          <Icon name="search" size={18} color={colors.faded} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Hledat model (např. gemini, claude)..."
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

        {/* Filter Category Chips */}
        <View style={styles.chipsRow}>
          {categoryChips.map(chip => {
            const isSelected = category === chip.key
            return (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setCategory(chip.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.disabled,
                    flexDirection: 'row',
                    alignItems: 'center',
                  },
                ]}>
                {chip.icon === 'star' && (
                  <Icon
                    name="star"
                    size={13}
                    color={isSelected ? '#FFFFFF' : '#F59E0B'}
                    style={{ marginRight: 4 }}
                  />
                )}
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

        {/* Models FlatList */}
        <FlatList
          data={filteredModels}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <Text style={{ textAlign: 'center', color: colors.faded, marginTop: 40, fontSize: metrics.fontSizes.p }}>
                Žádné modely nenalezeny.
              </Text>
            )
          }
          renderItem={({ item }) => {
            const isSelected = item.id === selectedModelId
            const isFavorite = favoriteModelIds.includes(item.id)
            const pricingStr = formatPricing(item.pricing)
            const contextStr = item.context_length
              ? `${Math.round(item.context_length / 1000)}k ctx`
              : ''

            return (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={[
                  styles.modelRow,
                  {
                    borderBottomColor: colors.disabled,
                    backgroundColor: isSelected ? `${colors.primary}18` : colors.background,
                  },
                ]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.modelHeaderRow}>
                    <Text
                      style={[
                        styles.modelName,
                        {
                          color: isSelected ? colors.primary : colors.text,
                          fontSize: metrics.fontSizes.p,
                          fontWeight: isSelected ? 'bold' : '600',
                        },
                      ]}>
                      {item.name}
                    </Text>
                    {contextStr.length > 0 && (
                      <View style={[styles.contextBadge, { backgroundColor: colors.surface }]}>
                        <Text style={{ color: colors.faded, fontSize: 10 }}>{contextStr}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.modelId, { color: colors.faded, fontSize: metrics.fontSizes.small }]}>
                    {item.id}
                  </Text>
                  {pricingStr.length > 0 && (
                    <Text
                      style={[
                        styles.pricingText,
                        {
                          color: pricingStr.includes('Zdarma') ? colors.secondary : colors.accent,
                          fontSize: metrics.fontSizes.small,
                        },
                      ]}>
                      {pricingStr}
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {isSelected && (
                    <View style={[styles.selectedIconWrap, { backgroundColor: colors.primary, marginRight: 8 }]}>
                      <Icon name="check" size={16} color="#FFFFFF" />
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => toggleFavorite(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: 6 }}>
                    <Icon
                      name="star"
                      size={20}
                      color={isFavorite ? '#F59E0B' : colors.disabled}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: colors.faded, fontSize: metrics.fontSizes.p, textAlign: 'center' }}>
                Žádný model neodpovídá zadání.
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
  backButton: {
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modelName: {
    marginBottom: 2,
  },
  contextBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modelId: {
    marginBottom: 2,
  },
  pricingText: {
    fontWeight: '500',
  },
  selectedIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
