import { applyModelChoice, applySystemPromptChoice } from '../src/lib/llmSession'

describe('llm session defaults', () => {
  it('uses a picked model for the session and stores it only when set as global', () => {
    expect(applyModelChoice({ id: 'openai/gpt-4o-mini', name: 'GPT-4o mini' }, false)).toEqual({
      model: { id: 'openai/gpt-4o-mini', name: 'GPT-4o mini' },
      globalModel: null,
    })

    expect(applyModelChoice({ id: 'google/gemini-2.5-flash', name: 'Gemini' }, true)).toEqual({
      model: { id: 'google/gemini-2.5-flash', name: 'Gemini' },
      globalModel: { id: 'google/gemini-2.5-flash', name: 'Gemini' },
    })
  })

  it('falls back to the model id when the picker has no display name', () => {
    expect(applyModelChoice({ id: 'meta-llama/llama-3.3-70b-instruct', name: '' }, true).model.name).toBe(
      'meta-llama/llama-3.3-70b-instruct',
    )
  })

  it('applies a system prompt to the session and stores it only when save as default is checked', () => {
    expect(applySystemPromptChoice('  jen tenhle dotaz  ', false)).toEqual({
      prompt: 'jen tenhle dotaz',
      globalPrompt: null,
    })

    expect(applySystemPromptChoice('  novy vychozi  ', true)).toEqual({
      prompt: 'novy vychozi',
      globalPrompt: 'novy vychozi',
    })
  })
})