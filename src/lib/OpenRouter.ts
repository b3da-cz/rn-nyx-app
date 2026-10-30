import {
  collectNicknames,
  createNicknameScrubber,
  postOptsOutOfAgents,
  withAnonymityInstruction,
} from './llmAgents'
import { llmPostDay } from './llmPostSelection'
import { consumeLlmStreamBody, createLlmStreamState, finishLlmStreamBody, LlmStreamState } from './llmStream'
import { assertLumoQuota, LUMO_BASE_URL, LUMO_CONTEXT_TOKENS, LUMO_MODEL_ID, LUMO_MODEL_NAME } from './lumo'
import { t } from './Strings'

export type OpenRouterPricing = {
  prompt?: string
  completion?: string
}

export type OpenRouterModel = {
  id: string
  name: string
  description?: string
  context_length?: number
  pricing?: OpenRouterPricing
}

export const DEFAULT_LLM_SYSTEM_PROMPT =
  'Jsi asistent pro českou diskuzní sociální síť Nyx.cz. Tvým úkolem je analyzovat, shrnovat nebo zpracovávat příspěvky z diskuze podle zadání uživatele.\n\n' +
  'Pravidla formátování odpovědi:\n' +
  '- Odpověď formátuj v přehledném Markdownu.\n' +
  '- Kdykoliv odkazuješ na příspěvek nebo zmiňuješ autora, VŽDY vytvoř Markdown odkaz ve formátu [@autor](https://nyx.cz/discussion/{discussion_id}/id/{post_id}), kde {discussion_id} je ID diskuze a {post_id} je ID příspěvku (např. [@FOO](https://nyx.cz/discussion/{discussion_id}/id/{post_id}) ). Přímo kolem linku nedělej další symboly!\n' +
  '- Odpovídej věcně, srozumitelně a v češtině, pokud si uživatel nevyžádá jiný jazyk.\n' +
  '- datum ve formátu dd.mm.yyyy, čas 24h hh:mm, případně hh:mm:ss\n' +
  '- na začátku přidej nadpis o jaký typ odpovědi jde (souhrn, tabulka, rozbor, etc.) s názvem a id klubu a podnadpis s range id postu a přesný čas prvního a posledního postu'

export type OpenRouterChatParams = {
  apiKey: string
  model: string
  userPrompt: string
  discussionId?: number | string
  discussionTitle?: string
  posts?: any[]
  dateFrom?: string
  dateTo?: string
  systemPrompt?: string
  provider?: LlmProviderId
  baseUrl?: string
  onProgress?: (message: string) => void
  onDelta?: (snapshot: { content: string; reasoning: string }) => void
}

export type OpenRouterChatResult = {
  content: string
  reasoning?: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  model?: string
}

export const RECOMMENDED_MODEL_IDS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash-lite:free',
  'anthropic/claude-3.5-haiku',
  'deepseek/deepseek-chat',
  'meta-llama/llama-3.3-70b-instruct',
  'openai/gpt-4o-mini',
]

export type LlmProviderId = 'lumo' | 'openrouter' | 'openai'

export type LlmSavedModel = {
  id: string
  name: string
}

export type LlmSavedModels = Partial<Record<LlmProviderId, LlmSavedModel>>

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export function normalizeLlmProvider(value: unknown): LlmProviderId {
  if (value === 'lumo' || value === 'openai' || value === 'openrouter') {
    return value
  }
  // Queued tasks saved before a provider field still belong to OpenRouter.
  return 'openrouter'
}

export function resolveStoredLlmProvider(
  config?: {
    llmProvider?: string
    llmProviderChosen?: boolean
    openRouterApiKey?: string
    selectedLlmModel?: string
  } | null,
): LlmProviderId {
  const raw = config?.llmProvider
  if (config?.llmProviderChosen) {
    if (raw === 'lumo' || raw === 'openai' || raw === 'openrouter') {
      return raw
    }
    return 'lumo'
  }
  if (raw === 'openai' || raw === 'lumo') {
    return raw
  }
  const hasOpenRouterSetup = !!(config?.openRouterApiKey || '').trim() || !!(config?.selectedLlmModel || '').trim()
  if (raw === 'openrouter' || raw == null || raw === '') {
    return hasOpenRouterSetup ? 'openrouter' : 'lumo'
  }
  return 'lumo'
}

// http is allowed so a model running on the local network can be used.
// A bare host still gets https, because that is the public API default.
export function normalizeOpenAiBaseUrl(input: string): string {
  let url = (input || '').trim()
  if (!url) {
    return ''
  }
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }
  url = url.replace(/\/+$/, '')
  url = url.replace(/\/chat\/completions$/i, '')
  url = url.replace(/\/completions$/i, '')
  url = url.replace(/\/models$/i, '')
  url = url.replace(/\/+$/, '')
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return ''
  }
  if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || parsed.username || parsed.password) {
    return ''
  }
  // Do not read URL.pathname. React Native's URL adds a trailing slash, so
  // origin + pathname became /v1/ and the next segment turned into /v1//models.
  const host = `${parsed.protocol}//${parsed.host}`
  if (!url.startsWith(host)) {
    return ''
  }
  const path = url.slice(host.length).replace(/\/+$/, '')
  if (!path || path === '/') {
    return `${host}/v1`
  }
  return `${host}${path.startsWith('/') ? path : `/${path}`}`
}

export function llmApiUrl(base: string, path: 'models' | 'chat/completions'): string {
  return `${base.replace(/\/+$/, '')}/${path}`
}

function llmAuthHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

function llmChatHeaders(provider: LlmProviderId, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (provider !== 'lumo') {
    headers.Authorization = `Bearer ${apiKey}`
  }
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://nyx.cz'
    headers['X-Title'] = 'Nyx NNN'
  }
  return headers
}

function llmChatErrorFallback(provider: LlmProviderId): string {
  if (provider === 'lumo') {
    return 'Chyba Proton Lumo'
  }
  return provider === 'openai' ? 'Chyba API' : 'Chyba OpenRouter API'
}

export function openAiBaseUrlError(input: string): string | null {
  const trimmed = (input || '').trim()
  if (!trimmed) {
    return t('profile.llm.endpointRequired') || 'Nejprve zadejte endpoint.'
  }
  if (!normalizeOpenAiBaseUrl(trimmed)) {
    return t('profile.llm.endpointInvalid') || 'Endpoint není platná adresa.'
  }
  return null
}

export type LlmConnectionConfig = {
  llmProvider?: string
  llmProviderChosen?: boolean
  openRouterApiKey?: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  isLlmEnabled?: boolean
  selectedLlmModel?: string
  selectedLlmModelName?: string
}

export type LlmConnection = {
  provider: LlmProviderId
  apiKey: string
  baseUrl: string
}

export function llmConnectionFromConfig(config?: LlmConnectionConfig | null): LlmConnection {
  const provider = resolveStoredLlmProvider(config)
  if (provider === 'lumo') {
    return { provider, apiKey: '', baseUrl: LUMO_BASE_URL }
  }
  if (provider === 'openai') {
    return {
      provider,
      apiKey: (config?.openaiApiKey || '').trim(),
      baseUrl: normalizeOpenAiBaseUrl(config?.openaiBaseUrl || ''),
    }
  }
  return {
    provider: 'openrouter',
    apiKey: (config?.openRouterApiKey || '').trim(),
    baseUrl: OPENROUTER_BASE_URL,
  }
}

export function activeLlmModel(config?: LlmConnectionConfig | null): { id: string; name: string } {
  if (resolveStoredLlmProvider(config) === 'lumo') {
    return { id: LUMO_MODEL_ID, name: LUMO_MODEL_NAME }
  }
  const id = (config?.selectedLlmModel || '').trim()
  return { id, name: (config?.selectedLlmModelName || id).trim() }
}

export function isLlmAssistantAvailable(config?: LlmConnectionConfig | null): boolean {
  if (!config?.isLlmEnabled) {
    return false
  }
  const connection = llmConnectionFromConfig(config)
  if (connection.provider === 'lumo') {
    return true
  }
  if (!activeLlmModel(config).id || !connection.apiKey) {
    return false
  }
  return connection.provider === 'openrouter' || !!connection.baseUrl
}

export function sortLlmModels(models: OpenRouterModel[]): OpenRouterModel[] {
  return [...models].sort((a, b) => {
    const aRec = RECOMMENDED_MODEL_IDS.indexOf(a.id)
    const bRec = RECOMMENDED_MODEL_IDS.indexOf(b.id)
    if (aRec !== -1 && bRec !== -1) {
      return aRec - bRec
    }
    if (aRec !== -1) {
      return -1
    }
    if (bRec !== -1) {
      return 1
    }
    return (a.name || a.id).localeCompare(b.name || b.id)
  })
}

export function modelsFromApiPayload(json: any): OpenRouterModel[] {
  const raw = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.models)
        ? json.models
        : []
  const models: OpenRouterModel[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      const id = item.trim()
      models.push({ id, name: id })
      continue
    }
    if (!item || typeof item !== 'object') {
      continue
    }
    const id = String(item.id || '').trim()
    if (!id) {
      continue
    }
    const name = String(item.name || item.display_name || id).trim() || id
    models.push({
      id,
      name,
      description: typeof item.description === 'string' ? item.description : undefined,
      context_length: typeof item.context_length === 'number' ? item.context_length : undefined,
      pricing: item.pricing && typeof item.pricing === 'object' ? item.pricing : undefined,
    })
  }
  return sortLlmModels(models)
}

function llmApiErrorMessage(json: any, status: number, fallback: string): string {
  if (json?.error && typeof json.error === 'object' && json.error.message) {
    return String(json.error.message)
  }
  if (typeof json?.error === 'string' && json.error.trim()) {
    return json.error.trim()
  }
  if (typeof json?.message === 'string' && json.message.trim()) {
    return json.message.trim()
  }
  return `${fallback} (${status}).`
}

/**
 * Format per-token pricing to human-friendly USD per 1M tokens.
 */
export function formatPricing(pricing?: OpenRouterPricing): string {
  if (!pricing) {
    return ''
  }
  const promptPrice = parseFloat(pricing.prompt || '0')
  const completionPrice = parseFloat(pricing.completion || '0')

  if (promptPrice === 0 && completionPrice === 0) {
    return t('llm.categoryFree') || 'Zdarma'
  }

  const promptPerM = promptPrice * 1_000_000
  const completionPerM = completionPrice * 1_000_000

  const formatCost = (cost: number) => {
    if (cost === 0) {
      return '$0'
    }
    if (cost < 0.01) {
      return `$${cost.toFixed(3)}`
    }
    if (cost < 1) {
      return `$${cost.toFixed(2)}`
    }
    return `$${cost.toFixed(2)}`
  }

  return `${formatCost(promptPerM)} / ${formatCost(completionPerM)} per 1M`
}

/**
 * Fetch models from OpenRouter or from an OpenAI-compatible /models endpoint.
 */
export async function fetchLlmModels({
  provider: providerInput,
  apiKey,
  baseUrl,
}: {
  provider?: LlmProviderId
  apiKey: string
  baseUrl?: string
}): Promise<OpenRouterModel[]> {
  const provider = normalizeLlmProvider(providerInput)
  if (provider === 'lumo') {
    return [{ id: LUMO_MODEL_ID, name: LUMO_MODEL_NAME, context_length: LUMO_CONTEXT_TOKENS }]
  }
  const trimmedKey = (apiKey || '').trim()
  if (!trimmedKey) {
    throw new Error(
      provider === 'openai'
        ? t('profile.llm.apiKeyRequiredOpenai') || 'Nejprve zadejte API klíč.'
        : t('profile.llm.apiKeyRequired') || 'API klíč nesmí být prázdný.',
    )
  }

  const resolvedBase = provider === 'openai' ? normalizeOpenAiBaseUrl(baseUrl || '') : OPENROUTER_BASE_URL
  if (provider === 'openai' && !resolvedBase) {
    throw new Error(openAiBaseUrlError(baseUrl || '') || t('profile.llm.endpointRequired') || 'Nejprve zadejte endpoint.')
  }

  const res = await fetch(llmApiUrl(resolvedBase, 'models'), {
    method: 'GET',
    headers: llmAuthHeaders(trimmedKey),
  })

  const json = await res.json()
  if (!res.ok || json.error) {
    throw new Error(llmApiErrorMessage(json, res.status, 'Chyba při stahování modelů'))
  }

  return modelsFromApiPayload(json)
}

/**
 * Fetch available models from OpenRouter API.
 */
export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  return fetchLlmModels({ provider: 'openrouter', apiKey })
}

/**
 * Filter posts by date range [dateFrom, dateTo] and format them for LLM prompt.
 * Posts are sorted chronologically (oldest to newest) for natural reading order.
 */
export function filterAndFormatPostsForLlm(
  posts: any[] = [],
  dateFrom?: string,
  dateTo?: string,
  discussionTitle = '',
): { formattedText: string; count: number; wordCount: number; matchedPosts: any[]; ignoredCount: number } {
  const inRange = posts.filter(post => {
    if (!post || post.location === 'header' || post.location === 'home' || post.isClubStart) {
      return false
    }
    const postDay = llmPostDay(post)
    // A bounded range only keeps posts whose day is inside it. Loaded posts with
    // no date used to stay in the payload after the range was narrowed.
    if ((dateFrom || dateTo) && !postDay) {
      return false
    }
    if (dateFrom && postDay < dateFrom) {
      return false
    }
    if (dateTo && postDay > dateTo) {
      return false
    }
    return true
  })
  const ignoredCount = inRange.filter(postOptsOutOfAgents).length
  const filtered = inRange.filter(post => !postOptsOutOfAgents(post))

  // Sort chronologically (oldest first: smaller ID first)
  const sorted = [...filtered].sort((a, b) => {
    if (a.id != null && b.id != null) {
      return Number(a.id) - Number(b.id)
    }
    const aTime = a.inserted_at || ''
    const bTime = b.inserted_at || ''
    return aTime.localeCompare(bTime)
  })

  const lines: string[] = []
  let totalWords = 0

  for (const post of sorted) {
    const idStr = post.id != null ? `[ID:${post.id}] ` : ''
    const dateStr = post.inserted_at ? `[${post.inserted_at}] ` : ''
    const author = post.username ? `@${post.username}: ` : ''
    const rawContent = (post.parsed?.clearText || post.content || '').trim()
    const content = rawContent.replace(/\s+/g, ' ')

    if (content.length > 0) {
      const line = `${idStr}${dateStr}${author}${content}`
      lines.push(line)
      totalWords += content.split(' ').filter(Boolean).length
    }
  }

  const titlePrefix = discussionTitle ? `Diskuze: "${discussionTitle}"\n\n` : ''
  const formattedText = `${titlePrefix}${lines.join('\n\n')}`

  return {
    formattedText,
    count: sorted.length,
    wordCount: totalWords,
    matchedPosts: sorted,
    ignoredCount,
  }
}

function postChatStream(
  url: string,
  headers: Record<string, string>,
  body: string,
  onState: (state: LlmStreamState) => void,
): Promise<LlmStreamState> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let seen = 0
    let pending = ''
    let jsonMode = false
    let state = createLlmStreamState()
    const pump = () => {
      const text = xhr.responseText || ''
      if (text.length < seen) {
        return
      }
      const chunk = text.slice(seen)
      seen = text.length
      const consumed = consumeLlmStreamBody(state, pending, chunk)
      state = consumed.state
      pending = consumed.pending
      jsonMode = jsonMode || consumed.jsonMode
      if (!jsonMode) {
        onState(state)
      }
    }
    xhr.onprogress = pump
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 3) {
        pump()
      }
      if (xhr.readyState !== 4) {
        return
      }
      pump()
      if (xhr.status < 200 || xhr.status >= 300) {
        let parsed: any = { error: xhr.responseText }
        try {
          parsed = JSON.parse(xhr.responseText || '')
        } catch {
          // keep the text error
        }
        reject(Object.assign(new Error('llm stream'), { status: xhr.status, body: parsed }))
        return
      }
      const asJson = jsonMode || (xhr.responseText || '').trimStart().startsWith('{')
      state = finishLlmStreamBody(state, pending, asJson)
      onState(state)
      resolve(state)
    }
    xhr.onerror = () => reject(new Error('Chyba spojení.'))
    xhr.open('POST', url)
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value))
    xhr.send(body)
  })
}

/**
 * Send request to OpenRouter Chat Completions endpoint.
 */
export async function sendOpenRouterChat({
  apiKey,
  model,
  userPrompt,
  discussionId,
  discussionTitle = '',
  posts = [],
  dateFrom,
  dateTo,
  systemPrompt,
  provider: providerInput,
  baseUrl,
  onProgress,
  onDelta,
}: OpenRouterChatParams): Promise<OpenRouterChatResult> {
  const provider = normalizeLlmProvider(providerInput)
  const resolvedBase =
    provider === 'lumo' ? LUMO_BASE_URL : provider === 'openai' ? normalizeOpenAiBaseUrl(baseUrl || '') : OPENROUTER_BASE_URL
  const resolvedModel = provider === 'lumo' ? LUMO_MODEL_ID : model
  const trimmedKey = (apiKey || '').trim()
  if (provider !== 'lumo' && !trimmedKey) {
    throw new Error(provider === 'openai' ? 'Chybí API klíč.' : 'Chybí OpenRouter API klíč.')
  }
  if (provider === 'openai' && !resolvedBase) {
    throw new Error(openAiBaseUrlError(baseUrl || '') || 'Nejprve zadejte endpoint.')
  }
  if (!resolvedModel) {
    throw new Error('Není vybrán žádný model.')
  }
  if (!userPrompt || !userPrompt.trim()) {
    throw new Error('Zadejte zadání (prompt) pro model.')
  }

  onProgress?.('Filtruji a připravuji příspěvky...')
  const { formattedText, count, wordCount, matchedPosts, ignoredCount } = filterAndFormatPostsForLlm(
    posts,
    dateFrom,
    dateTo,
    discussionTitle,
  )

  if (count === 0) {
    if (ignoredCount > 0) {
      throw new Error(
        t('llm.agentsAllIgnored') || 'Všechny příspěvky v období mají zákaz shrnutí ([agents:ignore]).',
      )
    }
    throw new Error('V zadaném časovém období nebyly nalezeny žádné příspěvky ke zpracování.')
  }

  onProgress?.(`Kontext připraven: ${count} příspěvků (cca ${wordCount.toLocaleString()} slov)`)

  const dateRangeLabel =
    dateFrom && dateTo
      ? `${dateFrom} až ${dateTo}`
      : dateFrom
      ? `od ${dateFrom}`
      : dateTo
      ? `do ${dateTo}`
      : 'celé vybrané období'

  const effectiveSystemPrompt = (systemPrompt && systemPrompt.trim())
    ? systemPrompt.trim()
    : DEFAULT_LLM_SYSTEM_PROMPT

  const resolvedSystemPrompt = effectiveSystemPrompt.replace(
    /\{discussion_id\}/g,
    discussionId ? String(discussionId) : '{discussion_id}',
  )

  const discIdLabel = discussionId ? ` (ID diskuze: ${discussionId})` : ''
  const postUrlPattern = discussionId
    ? `https://nyx.cz/discussion/${discussionId}/id/{post_id}`
    : 'https://nyx.cz/discussion/{discussion_id}/id/{post_id}'

  const scrubber = createNicknameScrubber(
    collectNicknames(matchedPosts, [userPrompt, discussionTitle, formattedText]),
  )
  const anonTitle = scrubber.apply(discussionTitle || 'Klub')
  const anonPrompt = scrubber.apply(userPrompt.trim())
  const anonPosts = scrubber.apply(formattedText)
  const anonSystemPrompt = withAnonymityInstruction(scrubber.apply(resolvedSystemPrompt))

  const userMessage =
    `${anonPrompt}\n\n` +
    `--- Začátek příspěvků z diskuze "${anonTitle}"${discIdLabel} (${dateRangeLabel}, celkem ${count} příspěvků) ---\n` +
    `Příspěvky mají formát [ID:{post_id}] [{datum}] @{autor}: {text}. Autor je celý identifikátor USER_XXXX.\n` +
    `V odpovědi ho nech beze změny, včetně předpony USER_. Odkaz na příspěvek vytvoř jako [@USER_XXXX](${postUrlPattern}).\n\n` +
    `${anonPosts}\n\n` +
    `--- Konec příspěvků ---`

  if (provider === 'lumo') {
    await assertLumoQuota()
  }

  onProgress?.(
    provider === 'lumo'
      ? `Odesílám HTTP požadavek na Proton Lumo (${resolvedModel})...`
      : provider === 'openai'
        ? `Odesílám HTTP požadavek (${resolvedModel})...`
        : `Odesílám HTTP požadavek na OpenRouter (${resolvedModel})...`,
  )

  const headers = llmChatHeaders(provider, trimmedKey)

  const messages = [
    { role: 'system', content: anonSystemPrompt },
    { role: 'user', content: userMessage },
  ]
  const completionUrl = llmApiUrl(resolvedBase, 'chat/completions')

  if (onDelta) {
    onProgress?.('Čekám na první token...')
    const publish = (snap: LlmStreamState) => {
      onDelta({
        content: scrubber.restore(snap.content),
        reasoning: scrubber.restore(snap.reasoning),
      })
    }
    let streamed: LlmStreamState
    try {
      streamed = await postChatStream(
        completionUrl,
        headers,
        JSON.stringify({ model: resolvedModel, messages, stream: true }),
        publish,
      )
    } catch (err: any) {
      if (err?.body) {
        throw new Error(llmApiErrorMessage(err.body, err.status || 0, llmChatErrorFallback(provider)))
      }
      throw err
    }
    onProgress?.('Odpověď přijata, zpracovávám výsledek...')
    return {
      content: scrubber.restore(streamed.content),
      reasoning: scrubber.restore(streamed.reasoning),
      usage: streamed.usage,
      model: streamed.model || resolvedModel,
    }
  }

  const res = await fetch(completionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: resolvedModel, messages }),
  })

  onProgress?.(`HTTP status ${res.status}: Čekám na dokončení generování...`)

  const json = await res.json()
  if (!res.ok || json.error) {
    throw new Error(llmApiErrorMessage(json, res.status, llmChatErrorFallback(provider)))
  }

  onProgress?.('Odpověď přijata, zpracovávám výsledek...')
  const choice = json.choices?.[0]
  const content = scrubber.restore(choice?.message?.content || '')

  return {
    content,
    usage: json.usage,
    model: json.model || resolvedModel,
  }
}
