import React, { useEffect, useState } from 'react'
import { fetchLlmModels, LlmProviderId, normalizeLlmProvider, OpenRouterModel, Storage, t } from '../../lib'
import { LlmModelPickerDialog } from '../LlmModelPickerDialog'
import { LlmFormRow } from './LlmFormRow'

type Props = {
  apiKey: string
  provider?: LlmProviderId
  baseUrl?: string
  currentModelId: string
  currentModelName: string
  isGlobalModel: boolean
  onModelSelected: (model: OpenRouterModel, saveAsGlobal: boolean) => void
}

export const LlmModelBar: React.FC<Props> = ({
  apiKey,
  provider,
  baseUrl,
  currentModelId,
  currentModelName,
  isGlobalModel,
  onModelSelected,
}) => {
  const resolvedProvider = normalizeLlmProvider(provider)
  const [isPickerVisible, setIsPickerVisible] = useState(false)
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    setModels([])
  }, [resolvedProvider, apiKey, baseUrl])

  const handleOpenPicker = async () => {
    setIsPickerVisible(true)
    let cached: OpenRouterModel[] = []
    try {
      cached = (await Storage.getCachedLlmModels(resolvedProvider)) || []
      if (Array.isArray(cached) && cached.length > 0) {
        setModels(cached)
      }
    } catch (e) {
      console.warn('Failed to load cached models', e)
    }

    if (cached.length === 0 && apiKey) {
      setIsFetching(true)
      try {
        const fetched = await fetchLlmModels({ provider: resolvedProvider, apiKey, baseUrl })
        setModels(fetched)
        await Storage.setCachedLlmModels(fetched, resolvedProvider)
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
        catalog={resolvedProvider}
        selectedModelId={currentModelId}
        isGlobal={isGlobalModel}
        showGlobalToggle
        onSelect={(model, saveAsGlobal) => {
          setIsPickerVisible(false)
          onModelSelected(model, !!saveAsGlobal)
        }}
        onCancel={() => setIsPickerVisible(false)}
      />
    </>
  )
}
