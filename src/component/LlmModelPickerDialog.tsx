import React, { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Modal, SafeAreaView, ScrollView, TextInput, TouchableOpacity, View } from 'react-native'
import { IconButton, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { formatPricing, OpenRouterModel, RECOMMENDED_MODEL_IDS, Storage, Styling, t, useTheme } from '../lib'
import { FormRowToggleComponent } from './FormRowToggleComponent'

type Props = {
  isVisible: boolean
  models: OpenRouterModel[]
  selectedModelId: string
  isLoading?: boolean
  isGlobal?: boolean
  showGlobalToggle?: boolean
  onToggleGlobal?: (val: boolean) => void
  onSelect: (model: OpenRouterModel, saveAsGlobal?: boolean) => void
  onCancel: () => void
}

type FilterCategory = 'favorites' | 'recommended' | 'all' | 'free' | 'google' | 'anthropic' | 'meta' | 'deepseek'

export const LlmModelPickerDialog: React.FC<Props> = ({
  isVisible,
  models,
  selectedModelId,
  isLoading = false,
  isGlobal,
  showGlobalToggle,
  onToggleGlobal,
  onSelect,
  onCancel,
}) => {
  const theme = useTheme()
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = theme
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<FilterCategory>('recommended')
  const [favoriteModelIds, setFavoriteModelIds] = useState<string[]>([])
  const [saveAsGlobal, setSaveAsGlobal] = useState(!!isGlobal)

  React.useEffect(() => {
    if (isVisible) {
      setSaveAsGlobal(!!isGlobal)
    }
  }, [isVisible, isGlobal])

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

  const categoryOptions: { value: FilterCategory; label: string }[] = [
    { value: 'recommended', label: t('llm.categoryRecommended') || 'Doporučené' },
    { value: 'favorites', label: `${t('llm.categoryFavorites') || 'Oblíbené'} (${favoriteModelIds.length})` },
    { value: 'free', label: t('llm.categoryFree') || 'Zdarma' },
    { value: 'all', label: t('llm.categoryAll') || 'Vše' },
    { value: 'google', label: 'Google' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'deepseek', label: 'DeepSeek' },
    { value: 'meta', label: 'Meta Llama' },
  ]

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[Styling.groups.flexRowCentered, { height: 50, paddingRight: blocks.medium }]}>
          <IconButton
            icon={'arrow-left'}
            size={25}
            style={{ marginLeft: 10 }}
            color={colors.primary}
            rippleColor={colors.ripple}
            onPress={onCancel}
          />
          <Text numberOfLines={1} style={{ flex: 1, fontSize: fontSizes.p + 2, marginHorizontal: blocks.large }}>
            {t('llm.modelPickerTitle') || 'Výběr LLM modelu'}
          </Text>
          <Text style={{ color: colors.faded, fontSize: fontSizes.small }}>
            {`${filteredModels.length} / ${models.length}`}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: blocks.medium,
            marginBottom: blocks.small,
            height: 42,
          }}>
          <TextInput
            numberOfLines={1}
            textAlignVertical={'center'}
            selectionColor={colors.primary}
            value={search}
            onChangeText={setSearch}
            placeholder={t('llm.searchModelPlaceholder') || 'Hledat model (např. gemini, claude)...'}
            placeholderTextColor={colors.faded}
            style={{
              flex: 1,
              height: 42,
              color: colors.text,
              fontSize: fontSizes.p,
            }}
          />
          {!!search && (
            <IconButton icon={'close'} size={18} color={colors.faded} onPress={() => setSearch('')} />
          )}
        </View>

        <View style={{ marginBottom: blocks.small }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: blocks.medium,
            }}>
            {categoryOptions.map(option => {
              const isSelected = category === option.value
              return (
                <TouchableRipple
                  key={option.value}
                  rippleColor={colors.ripple}
                  onPress={() => setCategory(option.value)}
                  style={{
                    backgroundColor: isSelected ? colors.primary : colors.row,
                    paddingHorizontal: blocks.medium,
                    paddingVertical: blocks.small,
                    marginRight: blocks.small,
                    minHeight: 34,
                    justifyContent: 'center',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {option.value === 'favorites' && (
                      <Icon
                        name="star"
                        size={12}
                        color={isSelected ? '#FFFFFF' : '#F59E0B'}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontSize: fontSizes.small,
                        fontWeight: isSelected ? '700' : '400',
                      }}>
                      {option.label}
                    </Text>
                  </View>
                </TouchableRipple>
              )
            })}
          </ScrollView>
        </View>

        {(showGlobalToggle || onToggleGlobal !== undefined) && (
          <FormRowToggleComponent
            label={t('llm.globalModelToggle') || 'Uložit jako globální model'}
            value={saveAsGlobal}
            onChange={val => {
              setSaveAsGlobal(!!val)
              onToggleGlobal?.(!!val)
            }}
          />
        )}

        <FlatList
          data={filteredModels}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <Text
                style={{
                  color: colors.faded,
                  fontSize: fontSizes.p,
                  padding: blocks.large,
                  textAlign: 'center',
                }}>
                {t('llm.noModelsFound') || 'Žádné modely nenalezeny.'}
              </Text>
            )
          }
          renderItem={({ item }) => {
            const isSelected = item.id === selectedModelId
            const isFavorite = favoriteModelIds.includes(item.id)
            const pricingStr = formatPricing(item.pricing)
            const contextStr = item.context_length ? `${Math.round(item.context_length / 1000)}k ctx` : ''
            const metaParts = [contextStr, pricingStr].filter(Boolean).join('  ·  ')

            return (
              <TouchableRipple
                rippleColor={colors.ripple}
                onPress={() => onSelect(item, saveAsGlobal)}
                style={{
                  backgroundColor: colors.row,
                  borderLeftWidth: 3,
                  borderColor: isSelected ? colors.primary : colors.row || colors.transparent,
                  marginBottom: blocks.small,
                  paddingHorizontal: blocks.medium,
                  paddingVertical: blocks.medium,
                }}>
                <View>
                  <View style={Styling.groups.flexRowSpbCentered}>
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontSize: fontSizes.p - 1,
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '700' : '400',
                      }}>
                      {item.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleFavorite(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{ paddingLeft: blocks.medium }}>
                      <Icon name="star" size={16} color={isFavorite ? '#F59E0B' : colors.disabled} />
                    </TouchableOpacity>
                  </View>
                  <Text numberOfLines={1} style={{ color: colors.faded, fontSize: fontSizes.small, marginTop: 2 }}>
                    {item.id}
                  </Text>
                  {!!metaParts && (
                    <Text numberOfLines={1} style={{ color: colors.faded, fontSize: fontSizes.small - 1, marginTop: 2 }}>
                      {metaParts}
                    </Text>
                  )}
                </View>
              </TouchableRipple>
            )
          }}
        />
      </SafeAreaView>
    </Modal>
  )
}
