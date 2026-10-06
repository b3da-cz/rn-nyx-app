import {
  createLlmPromptTemplate,
  deleteLlmPromptTemplate,
  LlmPromptTemplate,
  LlmPromptTemplateStore,
  normalizeLlmPromptTemplateStore,
  overwriteLlmPromptTemplate,
  resolveLlmPromptTemplates,
} from '../src/lib/llmTemplates'

const builtins: LlmPromptTemplate[] = [
  { id: 'builtin-summary', name: 'Shrnutí', text: 'výchozí text', builtin: true },
]

const store: LlmPromptTemplateStore = {
  templates: [{ id: 'tpl-1', name: 'Moje', text: 'starý text' }],
  hiddenIds: [],
}

describe('llm prompt templates', () => {
  it('keeps an older list of custom templates', () => {
    expect(normalizeLlmPromptTemplateStore([{ id: 'tpl-1', name: 'Moje', text: 'starý text' }, { id: 1 }])).toEqual(store)
  })

  it('creates a template from the current prompt and ignores an empty name', () => {
    expect(createLlmPromptTemplate(store, '  Nová  ', '  aktuální prompt  ', 'tpl-2')).toEqual({
      templates: [{ id: 'tpl-2', name: 'Nová', text: 'aktuální prompt' }, store.templates[0]],
      hiddenIds: [],
    })
    expect(createLlmPromptTemplate(store, '   ', 'text')).toBeNull()
  })

  it('overwrites a saved template and a default template', () => {
    expect(overwriteLlmPromptTemplate(store, store.templates[0], '  nový text  ')).toEqual({
      templates: [{ id: 'tpl-1', name: 'Moje', text: 'nový text' }],
      hiddenIds: [],
    })
    const overwritten = overwriteLlmPromptTemplate(store, builtins[0], '  upravené  ')
    expect(overwritten).toEqual({
      templates: [
        store.templates[0],
        { id: 'builtin-summary', name: 'Shrnutí', text: 'upravené', builtin: true },
      ],
      hiddenIds: [],
    })
    expect(resolveLlmPromptTemplates(overwritten!, builtins)[0]).toEqual({
      id: 'builtin-summary',
      name: 'Shrnutí',
      text: 'upravené',
      builtin: true,
    })
  })

  it('deletes a saved template and hides a default template', () => {
    expect(deleteLlmPromptTemplate(store, store.templates[0])).toEqual({ templates: [], hiddenIds: [] })
    const hidden = deleteLlmPromptTemplate(store, builtins[0])
    expect(hidden.hiddenIds).toEqual(['builtin-summary'])
    expect(resolveLlmPromptTemplates(hidden, builtins)).toEqual(store.templates)
  })
})
