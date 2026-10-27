import {
  applyChatChunk,
  consumeSseText,
  createLlmStreamState,
  finishLlmStreamBody,
  splitStreamMarkdown,
} from '../src/lib/llmStream'

describe('splitStreamMarkdown', () => {
  it('keeps a closed tag and leaves an open tag as plain text', () => {
    const parts = splitStreamMarkdown('Ahoj **světe** a **ješ')
    expect(parts.stable).toBe('Ahoj **světe** a ')
    expect(parts.pending).toBe('**ješ')
  })

  it('formats a finished link and holds an unfinished one', () => {
    const parts = splitStreamMarkdown('viz [@USER_AB12](https://nyx.cz/x) a [dal')
    expect(parts.stable).toBe('viz [@USER_AB12](https://nyx.cz/x) a ')
    expect(parts.pending).toBe('[dal')
  })

  it('does not treat a nickname underscore as an open tag', () => {
    expect(splitStreamMarkdown('napsal USER_AB12 konec')).toEqual({
      stable: 'napsal USER_AB12 konec',
      pending: '',
    })
  })

  it('holds an open code fence and releases it after the closing fence', () => {
    expect(splitStreamMarkdown('text\n```\nkod').pending).toBe('```\nkod')
    const closed = splitStreamMarkdown('text\n```\nkod\n```\npo')
    expect(closed.pending).toBe('')
    expect(closed.stable).toContain('po')
  })
})

describe('chat stream chunks', () => {
  it('reads content and reasoning from OpenAI chunks and skips the content fallback', () => {
    let state = createLlmStreamState()
    let pending = ''
    const feed = (chunk: string) => {
      const next = consumeSseText(state, pending, chunk)
      state = next.state
      pending = next.pending
    }
    feed(
      'data: {"choices":[{"delta":{"reasoning":"přemýšlím"}}]}\n\n' +
        'data: {"choices":[{"delta":{"content":"Ahoj"}}]}\n\n',
    )
    feed('data: {"choices":[{"delta":{"content":" **světe**"}}]}\n\n')
    expect(state.reasoning).toBe('přemýšlím')
    expect(state.content).toBe('Ahoj **světe**')

    state = applyChatChunk(createLlmStreamState(), {
      choices: [{ delta: { reasoning: 'jen úvaha' } }],
    })
    state = applyChatChunk(state, { choices: [{ delta: { content: 'jen úvaha' } }] })
    expect(state.reasoning).toBe('jen úvaha')
    expect(state.content).toBe('')
  })

  it('keeps the usage chunk and stops on [DONE]', () => {
    const fed = consumeSseText(
      createLlmStreamState(),
      '',
      'data: {"model":"m","choices":[],"usage":{"prompt_tokens":2,"completion_tokens":3,"total_tokens":5}}\n\n' +
        'data: [DONE]\n\n',
    )
    expect(fed.state.done).toBe(true)
    expect(fed.state.usage?.total_tokens).toBe(5)
    expect(fed.state.model).toBe('m')
  })

  it('accepts a non-stream JSON body', () => {
    const done = finishLlmStreamBody(
      createLlmStreamState(),
      '{"model":"m","choices":[{"message":{"content":"Ahoj","reasoning":"hmm"}}],"usage":{"total_tokens":4}}',
      true,
    )
    expect(done.content).toBe('Ahoj')
    expect(done.reasoning).toBe('hmm')
    expect(done.usage?.total_tokens).toBe(4)
  })
})
