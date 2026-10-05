import React, { useState } from 'react'
import { fetchOpenRouterModels, OpenRouterModel, Storage, t } from '../../lib'
import { LlmModelPickerDialog } from '../LlmModelPickerDialog'
import { LlmFormRow } from './LlmFormRow'

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
    <>
      <LlmFormRow
        label={t('llm.model')}
        value={currentModelName || currentModelId || t('profile.llm.selectModel')}
        onPress={handleOpenPicker}
      />
      <LlmModelPickerDialog
        isVisible={isPickerVisible}
        models={models}
        isLoading={isFetching}
        selectedModelId={currentModelId}
        isGlobal={isGlobalModel}
        onToggleGlobal={onToggleGlobal}
        onSelect={model => {
          setIsPickerVisible(false)
          onModelSelected(model)
        }}
        onCancel={() => setIsPickerVisible(false)}
      />
    </>
  )
}
