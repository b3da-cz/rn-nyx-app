jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import { Storage } from '../src/lib/Storage'
import { LUMO_MAX_RPM, resetLumoQuotaForTests } from '../src/lib/lumo'
import {
  fetchLlmModels,
  isLlmAssistantAvailable,
  llmApiUrl,
  modelsFromApiPayload,
  normalizeLlmProvider,
  normalizeOpenAiBaseUrl,
  resolveStoredLlmProvider,
  sendOpenRouterChat,
} from '../src/lib/OpenRouter'

describe('OpenAI-compatible endpoint', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('normalizes a base URL to the /v1 root', () => {
    expect(normalizeOpenAiBaseUrl('https://api.openai.com')).toBe('https://api.openai.com/v1')
    expect(normalizeOpenAiBaseUrl('https://api.openai.com/v1/')).toBe('https://api.openai.com/v1')
    expect(normalizeOpenAiBaseUrl('https://api.openai.com/v1/chat/completions')).toBe('https://api.openai.com/v1')
    expect(normalizeOpenAiBaseUrl('https://api.openai.com/v1/models')).toBe('https://api.openai.com/v1')
    expect(normalizeOpenAiBaseUrl('api.openai.com/v1')).toBe('https://api.openai.com/v1')
    expect(normalizeOpenAiBaseUrl('https://api.groq.com/openai/v1')).toBe('https://api.groq.com/openai/v1')
  })

  it('keeps a local http endpoint and rejects a broken address', () => {
    expect(normalizeOpenAiBaseUrl('')).toBe('')
    expect(normalizeOpenAiBaseUrl('http://127.0.0.1:1234/v1')).toBe('http://127.0.0.1:1234/v1')
    expect(normalizeOpenAiBaseUrl('http://10.0.0.53:3004/v1/')).toBe('http://10.0.0.53:3004/v1')
    expect(normalizeOpenAiBaseUrl('http://10.0.0.53:3004/v1/chat/completions')).toBe('http://10.0.0.53:3004/v1')
    expect(normalizeOpenAiBaseUrl('http://192.168.1.20:8080')).toBe('http://192.168.1.20:8080/v1')
    expect(normalizeOpenAiBaseUrl('not a url')).toBe('')
  })

  it('joins the API path with a single slash', () => {
    expect(llmApiUrl('http://10.0.0.53:3004/v1/', 'models')).toBe('http://10.0.0.53:3004/v1/models')
    expect(llmApiUrl('http://10.0.0.53:3004/v1', 'chat/completions')).toBe(
      'http://10.0.0.53:3004/v1/chat/completions',
    )
  })

  it('maps an OpenAI model list onto the picker shape', () => {
    const models = modelsFromApiPayload({
      data: [
        { id: 'gpt-4o-mini', object: 'model', owned_by: 'openai' },
        { id: 'gpt-4o', name: 'GPT-4o' },
      ],
    })
    expect(models.map(model => model.id)).toEqual(['gpt-4o', 'gpt-4o-mini'])
    expect(models[0].name).toBe('GPT-4o')
    expect(models[1].name).toBe('gpt-4o-mini')
  })

  it('keeps recommended OpenRouter models first', () => {
    const models = modelsFromApiPayload({
      data: [
        { id: 'zzz/other', name: 'Other' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o mini' },
      ],
    })
    expect(models[0].id).toBe('openai/gpt-4o-mini')
  })

  it('loads models from the entered endpoint', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 'gpt-4o-mini' }] }),
    })) as any

    const models = await fetchLlmModels({
      provider: 'openai',
      apiKey: 'sk-test',
      baseUrl: 'https://api.openai.com/v1/',
    })

    expect(models[0].id).toBe('gpt-4o-mini')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer sk-test' }),
      }),
    )
  })

  it('posts chat to the entered endpoint without OpenRouter headers', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Hotovo.' } }],
        usage: { total_tokens: 3 },
      }),
    })) as any

    const result = await sendOpenRouterChat({
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      model: 'gpt-4o-mini',
      userPrompt: 'Shrň to',
      discussionId: 7,
      posts: [
        {
          id: 1,
          username: 'pepa',
          inserted_at: '2026-10-04 12:00:00',
          parsed: { clearText: 'Dneska prší.' },
        },
      ],
    })

    expect(result.content).toBe('Hotovo.')
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/chat/completions')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer sk-test')
    expect(init.headers['HTTP-Referer']).toBeUndefined()
    expect(JSON.parse(init.body).model).toBe('gpt-4o-mini')
  })

  it('uses Proton Lumo without a key and keeps a configured OpenRouter connection', () => {
    expect(normalizeLlmProvider(undefined)).toBe('openrouter')
    expect(normalizeLlmProvider('lumo')).toBe('lumo')
    expect(resolveStoredLlmProvider(undefined)).toBe('lumo')
    expect(resolveStoredLlmProvider({ llmProvider: 'openrouter' })).toBe('lumo')
    expect(
      resolveStoredLlmProvider({
        llmProvider: 'openrouter',
        openRouterApiKey: 'sk-or',
        selectedLlmModel: 'openai/gpt-4o-mini',
      }),
    ).toBe('openrouter')
    expect(
      resolveStoredLlmProvider({ llmProvider: 'openrouter', llmProviderChosen: true }),
    ).toBe('openrouter')
    expect(isLlmAssistantAvailable({ isLlmEnabled: true })).toBe(true)
    expect(isLlmAssistantAvailable({ isLlmEnabled: false })).toBe(false)
  })

  it('posts chat to Proton Lumo with the fixed model and no authorization header', async () => {
    resetLumoQuotaForTests()
    await Storage.setLumoQuota(null)
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Shrnutí.' } }],
        usage: { total_tokens: 4 },
      }),
    })) as any

    const result = await sendOpenRouterChat({
      provider: 'lumo',
      apiKey: '',
      model: 'other',
      userPrompt: 'Shrň to',
      discussionId: 7,
      posts: [
        {
          id: 1,
          username: 'pepa',
          inserted_at: '2026-10-04 12:00:00',
          parsed: { clearText: 'Dneska prší.' },
        },
      ],
    })

    expect(result.content).toBe('Shrnutí.')
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('https://lumo-api.proton.me/ai/v1/chat/completions')
    expect(init.headers.Authorization).toBeUndefined()
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body).model).toBe('lumo')
  })

  it('does not call Proton Lumo after the minute limit', async () => {
    resetLumoQuotaForTests()
    await Storage.setLumoQuota(null)
    const now = new Date()
    await Storage.setLumoQuota({
      day: `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`,
      dayCount: LUMO_MAX_RPM,
      stamps: Array.from({ length: LUMO_MAX_RPM }, () => now.getTime()),
    })
    global.fetch = jest.fn() as any

    await expect(
      sendOpenRouterChat({
        provider: 'lumo',
        apiKey: '',
        model: 'lumo',
        userPrompt: 'Shrň to',
        discussionId: 7,
        posts: [
          {
            id: 1,
            username: 'pepa',
            inserted_at: '2026-10-04 12:00:00',
            parsed: { clearText: 'Dneska prší.' },
          },
        ],
      }),
    ).rejects.toThrow(/20/)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('shows the assistant only when the active connection is complete', () => {
    expect(
      isLlmAssistantAvailable({
        isLlmEnabled: true,
        llmProvider: 'openrouter',
        openRouterApiKey: 'sk-or',
        selectedLlmModel: 'openai/gpt-4o-mini',
      }),
    ).toBe(true)
    expect(
      isLlmAssistantAvailable({
        isLlmEnabled: true,
        llmProvider: 'openai',
        openaiApiKey: 'sk-test',
        openaiBaseUrl: 'https://api.openai.com/v1',
        selectedLlmModel: 'gpt-4o-mini',
      }),
    ).toBe(true)
    expect(
      isLlmAssistantAvailable({
        isLlmEnabled: true,
        llmProvider: 'openai',
        openaiApiKey: 'sk-test',
        openaiBaseUrl: 'http://127.0.0.1:1234/v1',
        selectedLlmModel: 'local',
      }),
    ).toBe(true)
    expect(
      isLlmAssistantAvailable({
        isLlmEnabled: true,
        llmProvider: 'openai',
        openaiBaseUrl: 'https://api.openai.com/v1',
        selectedLlmModel: 'gpt-4o-mini',
      }),
    ).toBe(false)
  })
})
