export type LlmTokenUsage = {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

export type LlmStreamState = {
  content: string
  reasoning: string
  usage?: LlmTokenUsage
  model?: string
  done: boolean
}

export function createLlmStreamState(): LlmStreamState {
  return { content: '', reasoning: '', done: false }
}

const wordChar = /[0-9A-Za-z\u00C0-\u024F]/

function lineStart(text: string, index: number) {
  return index === 0 || text[index - 1] === '\n'
}

function beforeNewline(text: string, from: number) {
  const nl = text.indexOf('\n', from)
  return nl === -1 ? text.length : nl
}

function findMarker(text: string, marker: string, from: number, limit: number) {
  const at = text.indexOf(marker, from)
  if (at === -1 || at >= limit) {
    return -1
  }
  return at
}

// Completed markdown stays in `stable` and can be rendered. An open fence, or an
// inline tag that has not closed and has not reached the end of its line, stays
// in `pending` as plain text.
export function splitStreamMarkdown(text: string): { stable: string; pending: string } {
  if (!text) {
    return { stable: '', pending: '' }
  }
  const n = text.length
  let i = 0
  while (i < n) {
    if (lineStart(text, i) && text[i] === '`') {
      let ticks = 0
      while (i + ticks < n && text[i + ticks] === '`') {
        ticks += 1
      }
      if (ticks >= 3) {
        const fenceEnd = closeFence(text, i)
        if (fenceEnd === -1) {
          return { stable: text.slice(0, i), pending: text.slice(i) }
        }
        i = fenceEnd
        continue
      }
      if (i + ticks === n) {
        return { stable: text.slice(0, i), pending: text.slice(i) }
      }
    }

    if (text[i] === '`') {
      const limit = beforeNewline(text, i + 1)
      const close = findMarker(text, '`', i + 1, limit)
      if (close === -1) {
        if (limit === n) {
          return { stable: text.slice(0, i), pending: text.slice(i) }
        }
        i = limit + 1
        continue
      }
      i = close + 1
      continue
    }

    if (text.startsWith('**', i) || text.startsWith('__', i)) {
      const marker = text.slice(i, i + 2)
      const limit = beforeNewline(text, i + 2)
      const close = findMarker(text, marker, i + 2, limit)
      if (close === -1) {
        if (limit === n) {
          return { stable: text.slice(0, i), pending: text.slice(i) }
        }
        i = limit + 1
        continue
      }
      i = close + 2
      continue
    }

    if (text[i] === '[') {
      const limit = beforeNewline(text, i + 1)
      const bracket = findMarker(text, ']', i + 1, limit)
      if (bracket === -1) {
        if (limit === n) {
          return { stable: text.slice(0, i), pending: text.slice(i) }
        }
        i = limit + 1
        continue
      }
      if (text[bracket + 1] !== '(') {
        i += 1
        continue
      }
      const paren = findMarker(text, ')', bracket + 2, limit)
      if (paren === -1) {
        if (limit === n) {
          return { stable: text.slice(0, i), pending: text.slice(i) }
        }
        i = limit + 1
        continue
      }
      i = paren + 1
      continue
    }

    if ((text[i] === '*' || text[i] === '_') && text[i + 1] !== text[i] && italicBoundary(text, i)) {
      const marker = text[i]
      const limit = beforeNewline(text, i + 1)
      const close = findMarker(text, marker, i + 1, limit)
      if (close === -1) {
        if (limit === n) {
          return { stable: text.slice(0, i), pending: text.slice(i) }
        }
        i = limit + 1
        continue
      }
      i = close + 1
      continue
    }

    i += 1
  }
  return { stable: text, pending: '' }
}

function italicBoundary(text: string, index: number) {
  if (index === 0) {
    return true
  }
  return !wordChar.test(text[index - 1])
}

function closeFence(text: string, openAt: number) {
  const lineEnd = text.indexOf('\n', openAt + 3)
  if (lineEnd === -1) {
    return -1
  }
  let i = lineEnd + 1
  while (i < text.length) {
    if (text.startsWith('```', i)) {
      let end = i + 3
      if (text[end] === '\n') {
        end += 1
      }
      return end
    }
    const next = text.indexOf('\n', i)
    if (next === -1) {
      return -1
    }
    i = next + 1
  }
  return -1
}

function reasoningPiece(delta: any): string {
  if (!delta || typeof delta !== 'object') {
    return ''
  }
  if (typeof delta.reasoning === 'string' && delta.reasoning.length > 0) {
    return delta.reasoning
  }
  if (typeof delta.reasoning_content === 'string' && delta.reasoning_content.length > 0) {
    return delta.reasoning_content
  }
  if (Array.isArray(delta.reasoning_details)) {
    return delta.reasoning_details.map((part: any) => (typeof part?.text === 'string' ? part.text : '')).join('')
  }
  return ''
}

export function applyChatChunk(state: LlmStreamState, parsed: any): LlmStreamState {
  const choice = Array.isArray(parsed?.choices) ? parsed.choices[0] : undefined
  const delta = choice?.delta || {}
  let content = state.content
  let reasoning = state.reasoning
  const nextReasoning = reasoningPiece(delta)
  if (nextReasoning) {
    reasoning += nextReasoning
  }
  const contentPiece = typeof delta.content === 'string' ? delta.content : ''
  if (contentPiece) {
    const fallbackDump = !content && !!reasoning && contentPiece === reasoning
    if (!fallbackDump) {
      content += contentPiece
    }
  } else if (typeof choice?.text === 'string' && choice.text) {
    content += choice.text
  }
  const usage = parsed?.usage && typeof parsed.usage === 'object' ? parsed.usage : state.usage
  const model = typeof parsed?.model === 'string' && parsed.model ? parsed.model : state.model
  return { ...state, content, reasoning, usage, model }
}

export function applyCompletionJson(state: LlmStreamState, json: any): LlmStreamState {
  const message = json?.choices?.[0]?.message || {}
  const content = typeof message.content === 'string' ? message.content : state.content
  const fromMessage = reasoningPiece(message)
  return {
    content,
    reasoning: fromMessage || state.reasoning,
    usage: json?.usage && typeof json.usage === 'object' ? json.usage : state.usage,
    model: typeof json?.model === 'string' ? json.model : state.model,
    done: true,
  }
}

export function consumeSseText(
  state: LlmStreamState,
  pending: string,
  chunk: string,
): { state: LlmStreamState; pending: string } {
  const lines = (pending + chunk).split('\n')
  const rest = lines.pop() ?? ''
  let next = state
  for (const line of lines) {
    next = applySseLine(next, line)
    if (next.done) {
      break
    }
  }
  return { state: next, pending: next.done ? '' : rest }
}

function applySseLine(state: LlmStreamState, line: string): LlmStreamState {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) {
    return state
  }
  const data = trimmed.slice(5).trim()
  if (!data) {
    return state
  }
  if (data === '[DONE]') {
    return { ...state, done: true }
  }
  try {
    return applyChatChunk(state, JSON.parse(data))
  } catch {
    return state
  }
}

export function consumeLlmStreamBody(
  state: LlmStreamState,
  pending: string,
  chunk: string,
): { state: LlmStreamState; pending: string; jsonMode: boolean } {
  const combined = pending + chunk
  if (combined.trimStart().startsWith('{')) {
    return { state, pending: combined, jsonMode: true }
  }
  const consumed = consumeSseText(state, pending, chunk)
  return { ...consumed, jsonMode: false }
}

export function finishLlmStreamBody(state: LlmStreamState, pending: string, jsonMode: boolean): LlmStreamState {
  if (jsonMode) {
    try {
      return applyCompletionJson(state, JSON.parse(pending))
    } catch {
      return { ...state, done: true }
    }
  }
  const consumed = pending ? consumeSseText(state, '', pending.endsWith('\n') ? pending : `${pending}\n`) : { state, pending: '' }
  return { ...consumed.state, done: true }
}
