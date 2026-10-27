import React, { useEffect, useRef, useState } from 'react'
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const fetchSeq = useRef(0)

  useEffect(() => {
    fetchSeq.current += 1
    setModels([])
    setIsFetching(false)
    setLoadError(null)
  }, [resolvedProvider, apiKey, baseUrl])

  const reloadModels = async () => {
    const seq = ++fetchSeq.current
    setLoadError(null)
    setIsFetching(true)
    try {
      const fetched = await fetchLlmModels({ provider: resolvedProvider, apiKey, baseUrl })
      if (seq !== fetchSeq.current) {
        return
      }
      if (fetched.length === 0) {
        setModels([])
        setLoadError(t('profile.llm.noModels') || 'Server nevrátil žádné modely.')
        return
      }
      setModels(fetched)
      await Storage.setCachedLlmModels(fetched, resolvedProvider)
    } catch (e: any) {
      if (seq !== fetchSeq.current) {
        return
      }
      console.warn('Failed to fetch models', e)
      setLoadError(e?.message || t('profile.llm.errorFetchingModels') || 'Chyba při stahování modelů.')
    } finally {
      if (seq === fetchSeq.current) {
        setIsFetching(false)
      }
    }
  }

  const handleOpenPicker = async () => {
    setIsPickerVisible(true)
    let cached: OpenRouterModel[] = []
    try {
      cached = (await Storage.getCachedLlmModels(resolvedProvider)) || []
      if (Array.isArray(cached) && cached.length > 0) {
        setModels(cached)
        setLoadError(null)
      }
    } catch (e) {
      console.warn('Failed to load cached models', e)
    }

    if (cached.length === 0 && apiKey) {
      await reloadModels()
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
        loadError={loadError}
        catalog={resolvedProvider}
        selectedModelId={currentModelId}
        isGlobal={isGlobalModel}
        showGlobalToggle
        onReload={() => {
          void reloadModels()
        }}
        onSelect={(model, saveAsGlobal) => {
          setIsPickerVisible(false)
          onModelSelected(model, !!saveAsGlobal)
        }}
        onCancel={() => setIsPickerVisible(false)}
      />
    </>
  )
}
