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
  '- Kdykoliv odkazuješ na příspěvek nebo zmiňuješ autora, VŽDY vytvoř Markdown odkaz ve formátu [@autor](https://nyx.cz/discussion/{discussion_id}/id/{post_id}), kde {discussion_id} je ID diskuze a {post_id} je ID příspěvku (např. [@NYX](https://nyx.cz/discussion/{discussion_id}/id/12345)).\n' +
  '- Přímo kolem odkazu nedělej žádné symboly (závorky, hvězdičky, čárku, tečku, ..) - před [ a po ) MUSÍ být mezery!\n' +
  '- Odpovídej věcně, srozumitelně a v češtině, pokud si uživatel nevyžádá jiný jazyk.'

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
  onProgress?: (message: string) => void
}

export type OpenRouterChatResult = {
  content: string
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
    return 'Zdarma / Free'
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
 * Fetch available models from OpenRouter API.
 */
export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) {
    throw new Error('API klíč nesmí být prázdný.')
  }

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${trimmedKey}`,
      'Content-Type': 'application/json',
    },
  })

  const json = await res.json()
  if (!res.ok || json.error) {
    const errorMsg = json.error?.message || `Chyba při stahování modelů (${res.status}).`
    throw new Error(errorMsg)
  }

  const data: OpenRouterModel[] = json.data || []

  // Sort: recommended models first, then alphabetical by name
  return data.sort((a, b) => {
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
    return a.name.localeCompare(b.name)
  })
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
): { formattedText: string; count: number; wordCount: number; matchedPosts: any[] } {
  const filtered = posts.filter(post => {
    if (!post || post.location === 'header' || post.location === 'home') {
      return false
    }
    const insertedAt = post.inserted_at || ''
    const postDay = insertedAt.length >= 10 ? insertedAt.substring(0, 10) : ''

    if (dateFrom && postDay && postDay < dateFrom) {
      return false
    }
    if (dateTo && postDay && postDay > dateTo) {
      return false
    }
    return true
  })

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
  }
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
  onProgress,
}: OpenRouterChatParams): Promise<OpenRouterChatResult> {
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) {
    throw new Error('Chybí OpenRouter API klíč.')
  }
  if (!model) {
    throw new Error('Není vybrán žádný model.')
  }
  if (!userPrompt || !userPrompt.trim()) {
    throw new Error('Zadejte zadání (prompt) pro model.')
  }

  onProgress?.('Filtruji a připravuji příspěvky...')
  const { formattedText, count, wordCount } = filterAndFormatPostsForLlm(posts, dateFrom, dateTo, discussionTitle)

  if (count === 0) {
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

  const userMessage =
    `${userPrompt.trim()}\n\n` +
    `--- Začátek příspěvků z diskuze "${discussionTitle || 'Klub'}"${discIdLabel} (${dateRangeLabel}, celkem ${count} příspěvků) ---\n` +
    `Příspěvky mají formát [ID:{post_id}] [{datum}] @{autor}: {text}.\n` +
    `Odkaz na příspěvek vytvoř jako [@autor](${postUrlPattern}).\n\n` +
    `${formattedText}\n\n` +
    `--- Konec příspěvků ---`

  onProgress?.(`Odesílám HTTP požadavek na OpenRouter (${model})...`)

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${trimmedKey}`,
      'HTTP-Referer': 'https://nyx.cz',
      'X-Title': 'Nyx NNN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: resolvedSystemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  })

  onProgress?.(`HTTP status ${res.status}: Čekám na dokončení generování...`)

  const json = await res.json()
  if (!res.ok || json.error) {
    const errorMsg = json.error?.message || `Chyba OpenRouter API (${res.status}).`
    throw new Error(errorMsg)
  }

  onProgress?.('Odpověď přijata, zpracovávám výsledek...')
  const choice = json.choices?.[0]
  const content = choice?.message?.content || ''

  return {
    content,
    usage: json.usage,
    model: json.model || model,
  }
}
