export type LlmModelChoice = {
  id: string
  name: string
}

// A picked model always replaces the one used for this assistant session.
// It becomes the stored default only when "set as global default" is on.
export function applyModelChoice(
  choice: LlmModelChoice,
  saveAsGlobal: boolean,
): { model: LlmModelChoice; globalModel: LlmModelChoice | null } {
  const model = { id: choice.id, name: choice.name || choice.id }
  return {
    model,
    globalModel: saveAsGlobal && model.id ? model : null,
  }
}

// Confirm always applies the prompt to the current session.
// "Save as default" stores that same text as the global prompt.
export function applySystemPromptChoice(
  prompt: string,
  saveAsDefault: boolean,
): { prompt: string; globalPrompt: string | null } {
  const next = prompt.trim()
  return {
    prompt: next,
    globalPrompt: saveAsDefault ? next : null,
  }
}
