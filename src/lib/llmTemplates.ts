export type LlmPromptTemplate = {
  id: string
  name: string
  text: string
  builtin?: boolean
}

export type LlmPromptTemplateStore = {
  templates: LlmPromptTemplate[]
  hiddenIds: string[]
}

export function normalizeLlmPromptTemplateStore(raw: any): LlmPromptTemplateStore {
  if (Array.isArray(raw)) {
    return { templates: raw.filter(isTemplate), hiddenIds: [] }
  }
  if (raw && typeof raw === 'object') {
    return {
      templates: Array.isArray(raw.templates) ? raw.templates.filter(isTemplate) : [],
      hiddenIds: Array.isArray(raw.hiddenIds) ? raw.hiddenIds.filter(id => typeof id === 'string') : [],
    }
  }
  return { templates: [], hiddenIds: [] }
}

export function resolveLlmPromptTemplates(
  store: LlmPromptTemplateStore,
  builtins: LlmPromptTemplate[],
): LlmPromptTemplate[] {
  const hidden = new Set(store.hiddenIds)
  const overrides = new Map(store.templates.map(item => [item.id, item]))
  const defaults = builtins
    .filter(item => !hidden.has(item.id))
    .map(item => {
      const saved = overrides.get(item.id)
      return saved ? { ...item, ...saved, name: saved.name || item.name, builtin: true } : item
    })
  const custom = store.templates.filter(item => !builtins.some(builtin => builtin.id === item.id))
  return [...defaults, ...custom]
}

export function createLlmPromptTemplate(
  store: LlmPromptTemplateStore,
  name: string,
  text: string,
  id = `tpl-${Date.now()}`,
): LlmPromptTemplateStore | null {
  const trimmedName = name.trim()
  const body = text.trim()
  if (!trimmedName || !body) {
    return null
  }
  return { ...store, templates: [{ id, name: trimmedName, text: body }, ...store.templates] }
}

export function overwriteLlmPromptTemplate(
  store: LlmPromptTemplateStore,
  template: LlmPromptTemplate,
  text: string,
): LlmPromptTemplateStore | null {
  const body = text.trim()
  if (!body) {
    return null
  }
  const index = store.templates.findIndex(item => item.id === template.id)
  const next = store.templates.slice()
  const saved = { id: template.id, name: template.name, text: body, builtin: template.builtin }
  if (index < 0) {
    next.push(saved)
  } else {
    next[index] = { ...next[index], text: body }
  }
  return { ...store, templates: next }
}

export function deleteLlmPromptTemplate(
  store: LlmPromptTemplateStore,
  template: LlmPromptTemplate,
): LlmPromptTemplateStore {
  const templates = store.templates.filter(item => item.id !== template.id)
  const hiddenIds =
    template.builtin && !store.hiddenIds.includes(template.id)
      ? [...store.hiddenIds, template.id]
      : store.hiddenIds
  return { templates, hiddenIds }
}

function isTemplate(item: any): item is LlmPromptTemplate {
  return !!item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.text === 'string'
}
