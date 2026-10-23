// Club header rules for the LLM assistant.
// Last match wins, so a hidden anchor at the end of the header overrides an earlier mention.
// Brackets are optional: [agents:mods:120m] and href="#agents:mods:120m" both match.

export type AgentRole = 'none' | 'owner' | 'board' | 'mods' | 'access' | 'all'

export type AgentRule = {
  role: AgentRole
  ttlRaw: string
  ttlMs: number
  found: boolean
}

// ar_* on the loaded discussion are the signed-in viewer's effective rights.
export type ViewerClubRights = {
  username?: string
  ownerUsername?: string
  canEditBoard: boolean
  canDelete: boolean
  hasExplicitAccess: boolean
}

const ROLES = 'none|owner|board|mods|access|all'
const AGENT_RULE_RE = new RegExp(
  `(?:^|[^A-Za-z0-9_])\\[?agents:(${ROLES})(?::([0-9]+[mhd]?))?\\]?`,
  'gi',
)
const IGNORE_RE = /\[agents:ignore\]/i
const NICK_RE = '[A-Za-z0-9_]{3,15}'
const TOKEN_RE = /USER_[A-Z0-9]{4}/gi
const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export const LLM_ANONYMITY_INSTRUCTION =
  'Jména uživatelů jsou anonymizována pomocí identifikátorů ve formátu USER_XXXX. V souhrnu používej přesně tyto identifikátory v základním tvaru (neskloňuj je), aby mohly být následně strojově nahrazeny zpět.'

export function defaultAgentRule(): AgentRule {
  return { role: 'all', ttlRaw: '0', ttlMs: 0, found: false }
}

export function emptyViewerRights(username?: string): ViewerClubRights {
  return {
    username,
    canEditBoard: false,
    canDelete: false,
    hasExplicitAccess: false,
  }
}

function ttlFromPart(part?: string): { raw: string; ms: number } {
  if (!part || part === '0') {
    return { raw: '0', ms: 0 }
  }
  const match = part.match(/^([1-9][0-9]*)([mhd])$/i)
  if (!match) {
    return { raw: '0', ms: 0 }
  }
  const amount = Number(match[1])
  const unit = match[2].toLowerCase()
  const ms = unit === 'm' ? amount * 60_000 : unit === 'h' ? amount * 3_600_000 : amount * 86_400_000
  return { raw: `${amount}${unit}`, ms }
}

export function parseAgentRule(source?: string | null): AgentRule {
  if (!source) {
    return defaultAgentRule()
  }
  const re = new RegExp(AGENT_RULE_RE.source, 'gi')
  let last: AgentRule | null = null
  let match: RegExpExecArray | null
  while ((match = re.exec(source))) {
    const next = source.charAt(re.lastIndex)
    // A dangling ":" or more letters means the ttl was cut short (120minutes, 2w).
    if (next === ':' || (next && /[A-Za-z0-9_]/.test(next))) {
      continue
    }
    const role = match[1].toLowerCase() as AgentRole
    const ttl = ttlFromPart(match[2])
    last = { role, ttlRaw: ttl.raw, ttlMs: ttl.ms, found: true }
  }
  return last || defaultAgentRule()
}

export function agentRuleSource(headers?: any[] | null): string {
  if (!Array.isArray(headers) || headers.length === 0) {
    return ''
  }
  return headers
    .map(header => {
      const raw = header?.content_raw?.data?.data
      return [header?.content, typeof raw === 'string' ? raw : '', header?.parsed?.clearText]
        .filter(part => typeof part === 'string' && part.length > 0)
        .join('\n')
    })
    .join('\n')
}

export function signedInUsername(nyx?: { username?: string; api?: { getAuth?: () => { username?: string } | null } }): string | undefined {
  return nyx?.username || nyx?.api?.getAuth?.()?.username || undefined
}

export function viewerRightsFromDiscussion(common: any, username?: string): ViewerClubRights {
  const discussion = common?.discussion || {}
  const ownerUsername = common?.owner?.user?.username || common?.owner?.username || undefined
  return {
    username,
    ownerUsername,
    canEditBoard: !!discussion.ar_edit,
    canDelete: !!discussion.ar_delete,
    hasExplicitAccess: common?.access_right != null,
  }
}

export function isClubOwner(rights: ViewerClubRights): boolean {
  const user = rights.username?.trim().toUpperCase()
  const owner = rights.ownerUsername?.trim().toUpperCase()
  return !!user && !!owner && user === owner
}

export function canUseAgent(rule: AgentRule, rights: ViewerClubRights): boolean {
  switch (rule.role) {
    case 'none':
      return false
    case 'all':
      return true
    case 'owner':
      return isClubOwner(rights)
    case 'board':
      return isClubOwner(rights) || rights.canEditBoard
    case 'mods':
      return isClubOwner(rights) || rights.canEditBoard || rights.canDelete
    case 'access':
      return isClubOwner(rights) || rights.hasExplicitAccess
    default:
      return false
  }
}

// Shown under the club title. 120m -> 120min, 2h -> 2h, 1d -> 1d. Permanent TTL stays blank.
export function formatAgentTtlLabel(rule: AgentRule): string {
  if (!rule.found || rule.ttlMs <= 0) {
    return ''
  }
  const match = rule.ttlRaw.match(/^(\d+)([mhd])$/)
  if (!match) {
    return ''
  }
  const amount = match[1]
  if (match[2] === 'm') {
    return `${amount}min`
  }
  if (match[2] === 'h') {
    return `${amount}h`
  }
  return `${amount}d`
}

export function formatTtlCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (days > 0) {
    return `${days} d ${hours} h`
  }
  if (hours > 0) {
    return `${hours} h ${minutes} min`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function isLlmResultExpired(item: { expiresAt?: string | null }, now = Date.now()): boolean {
  if (!item?.expiresAt) {
    return false
  }
  const at = Date.parse(item.expiresAt)
  return !Number.isNaN(at) && at <= now
}

export function postOptsOutOfAgents(post: any): boolean {
  if (!post) {
    return false
  }
  const raw = post.content_raw
  const chunks = [
    post.content,
    post.parsed?.clearText,
    post.parsed?.clearTextWithUrls,
    typeof raw === 'string' ? raw : raw?.data?.data,
    post.text,
  ]
  return chunks.some(chunk => typeof chunk === 'string' && IGNORE_RE.test(chunk))
}

export function withAnonymityInstruction(prompt: string): string {
  if (prompt.includes('Jména uživatelů jsou anonymizována')) {
    return prompt
  }
  const base = prompt.trim()
  return base ? `${base}\n\n${LLM_ANONYMITY_INSTRUCTION}` : LLM_ANONYMITY_INSTRUCTION
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function rememberNick(found: Map<string, string>, name?: string) {
  const trimmed = (name || '').trim()
  if (!trimmed) {
    return
  }
  const key = trimmed.toUpperCase()
  if (!found.has(key)) {
    found.set(key, trimmed)
  }
}

function collectNicksFromText(text: string, found: Map<string, string>) {
  if (!text) {
    return
  }
  const patterns = [
    new RegExp(`(?:^|[^A-Za-z0-9_])@(${NICK_RE})(?=$|[^A-Za-z0-9_])`, 'gi'),
    new RegExp(`(?:^|[^A-Za-z0-9_])(${NICK_RE})\\s+napsal[aá]?(?=$|[^A-Za-z0-9_])`, 'gi'),
    new RegExp(`class=["'][^"']*quote-header[^"']*["'][^>]*>\\s*(?:<a\\b[^>]*>\\s*)?(${NICK_RE})`, 'gi'),
    new RegExp(`data-username=["'](${NICK_RE})["']`, 'gi'),
  ]
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text))) {
      rememberNick(found, match[1])
    }
  }
}

export function collectNicknames(posts: any[] = [], extraTexts: string[] = []): string[] {
  const found = new Map<string, string>()
  for (const post of posts) {
    rememberNick(found, post?.username)
  }
  for (const post of posts) {
    const raw = post?.content_raw
    collectNicksFromText(
      [post?.content, post?.parsed?.clearText, post?.parsed?.clearTextWithUrls, typeof raw === 'string' ? raw : raw?.data?.data, post?.text]
        .filter(part => typeof part === 'string')
        .join('\n'),
      found,
    )
  }
  for (const text of extraTexts) {
    collectNicksFromText(text, found)
  }
  return [...found.values()]
}

function mintToken(used: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    let token = 'USER_'
    for (let i = 0; i < 4; i++) {
      token += TOKEN_ALPHABET[Math.floor(Math.random() * TOKEN_ALPHABET.length)]
    }
    if (!used.has(token)) {
      used.add(token)
      return token
    }
  }
  throw new Error('LLM nickname token space exhausted')
}

export type NicknameScrubber = {
  apply: (text: string) => string
  restore: (text: string) => string
}

export function createNicknameScrubber(names: string[]): NicknameScrubber {
  const tokens = new Map<string, string>()
  const reverse = new Map<string, string>()
  const used = new Set<string>()
  const unique: string[] = []
  for (const name of names) {
    const key = name.toUpperCase()
    if (tokens.has(key)) {
      continue
    }
    const token = mintToken(used)
    tokens.set(key, token)
    reverse.set(token, name)
    unique.push(name)
  }
  unique.sort((a, b) => b.length - a.length)
  const source = unique.length > 0 ? `(^|[^A-Za-z0-9_])(${unique.map(escapeRegExp).join('|')})(?=$|[^A-Za-z0-9_])` : ''

  return {
    apply(text: string) {
      if (!text || !source) {
        return text
      }
      return text.replace(new RegExp(source, 'giu'), (_match, prefix, name) => {
        const token = tokens.get(String(name).toUpperCase())
        return `${prefix}${token || name}`
      })
    },
    restore(text: string) {
      if (!text) {
        return text
      }
      return text.replace(new RegExp(TOKEN_RE.source, 'gi'), token => reverse.get(token.toUpperCase()) || token)
    },
  }
}
