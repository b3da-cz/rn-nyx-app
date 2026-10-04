import React, { useState } from 'react'
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { fetchOpenRouterModels, OpenRouterModel, Storage, t, useTheme } from '../../lib'
import { LlmModelPickerDialog } from '../LlmModelPickerDialog'

type Props = {
  apiKey: string
  currentModelId: string
  currentModelName: string
  isGlobalModel: boolean
  onModelSelected: (model: OpenRouterModel) => void
  onToggleGlobal: (val: boolean) => void
}

export const LlmModelBar: React.FC<Props> = ({
  apiKey,
  currentModelId,
  currentModelName,
  isGlobalModel,
  onModelSelected,
  onToggleGlobal,
}) => {
  const { colors, metrics } = useTheme()
  const [isPickerVisible, setIsPickerVisible] = useState(false)
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [isFetching, setIsFetching] = useState(false)

  const handleOpenPicker = async () => {
    setIsPickerVisible(true)
    let cached: OpenRouterModel[] = []
    try {
      cached = (await Storage.getCachedLlmModels()) || []
      if (Array.isArray(cached) && cached.length > 0) {
        setModels(cached)
      }
    } catch (e) {
      console.warn('Failed to load cached models', e)
    }

    if (cached.length === 0 && apiKey) {
      setIsFetching(true)
      try {
        const fetched = await fetchOpenRouterModels(apiKey)
        setModels(fetched)
        await Storage.setCachedLlmModels(fetched)
      } catch (e) {
        console.warn('Failed to fetch models', e)
      } finally {
        setIsFetching(false)
      }
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
      <TouchableOpacity onPress={handleOpenPicker} style={styles.modelRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ color: colors.faded, fontSize: metrics.fontSizes.small - 1 }}>
            {t('profile.llm.selectedModel') || 'Model'}:
          </Text>
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: metrics.fontSizes.small, fontWeight: '600' }}>
            {currentModelName || currentModelId || 'Vyberte model...'}
          </Text>
        </View>
        <Icon name="chevron-down" size={18} color={colors.faded} />
      </TouchableOpacity>

      <View style={[styles.globalRow, { borderTopColor: colors.disabled }]}>
        <Text style={{ color: colors.faded, fontSize: metrics.fontSizes.small - 1, flex: 1 }}>
          {t('llm.globalModelToggle') || 'Uložit jako globální model'}
        </Text>
        <Switch
          value={isGlobalModel}
          onValueChange={onToggleGlobal}
          trackColor={{ false: colors.disabled, true: colors.primary }}
        />
      </View>

      <LlmModelPickerDialog
        isVisible={isPickerVisible}
        models={models}
        selectedModelId={currentModelId}
        onSelect={model => {
          setIsPickerVisible(false)
          onModelSelected(model)
        }}
        onCancel={() => setIsPickerVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  globalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 6,
  },
})
