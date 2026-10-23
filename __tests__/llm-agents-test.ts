import {
  canUseAgent,
  collectNicknames,
  createNicknameScrubber,
  defaultAgentRule,
  emptyViewerRights,
  formatAgentTtlLabel,
  formatTtlCountdown,
  isSummaryCopyLocked,
  parseAgentRule,
  postOptsOutOfAgents,
  viewerRightsFromDiscussion,
  withAnonymityInstruction,
} from '../src/lib/llmAgents'
import { sendOpenRouterChat } from '../src/lib/OpenRouter'

const member = {
  username: 'PEPA',
  ownerUsername: 'OWNER',
  canEditBoard: false,
  canDelete: false,
  hasExplicitAccess: true,
}

describe('club agent rules', () => {
  it('defaults to everyone and a permanent result when the header has no rule', () => {
    expect(parseAgentRule('')).toEqual(defaultAgentRule())
    expect(parseAgentRule('obyčejná nástěnka')).toEqual({ role: 'all', ttlRaw: '0', ttlMs: 0, found: false })
  })

  it('reads a role and ttl from text and from a hidden anchor', () => {
    expect(parseAgentRule('pravidlo [agents:mods:120m] na konci')).toMatchObject({
      role: 'mods',
      ttlRaw: '120m',
      ttlMs: 120 * 60_000,
      found: true,
    })
    expect(parseAgentRule('<a href="#agents:access:2h"></a>')).toMatchObject({
      role: 'access',
      ttlRaw: '2h',
      ttlMs: 2 * 3_600_000,
    })
    expect(parseAgentRule('[agents:board]')).toMatchObject({ role: 'board', ttlRaw: '0', ttlMs: 0, found: true })
    expect(parseAgentRule('[agents:all:0]')).toMatchObject({ role: 'all', ttlRaw: '0', ttlMs: 0 })
    expect(parseAgentRule('[agents:none]')).toMatchObject({ role: 'none', ttlMs: 0 })
    expect(parseAgentRule('[Agents:Owner:1D]')).toMatchObject({ role: 'owner', ttlRaw: '1d', ttlMs: 86_400_000 })
  })

  it('keeps the last rule and ignores a ttl that runs into more letters', () => {
    const source = 'příklad [agents:all] <a href="#agents:mods:120m"></a>'
    expect(parseAgentRule(source)).toMatchObject({ role: 'mods', ttlRaw: '120m' })
    expect(parseAgentRule('[agents:mods:120minutes]')).toEqual(defaultAgentRule())
    expect(parseAgentRule('myagents:all')).toEqual(defaultAgentRule())
    expect(parseAgentRule('[agents:ignore]')).toEqual(defaultAgentRule())
  })

  it('keeps a recognized role when the ttl itself is not a duration', () => {
    expect(parseAgentRule('[agents:none:0m]')).toMatchObject({ role: 'none', ttlMs: 0, found: true })
  })

  it('formats the header ttl as a short stack line', () => {
    expect(formatAgentTtlLabel(parseAgentRule('[agents:access:120m]'))).toBe('120min')
    expect(formatAgentTtlLabel(parseAgentRule('[agents:access:2h]'))).toBe('2h')
    expect(formatAgentTtlLabel(parseAgentRule('[agents:access:1d]'))).toBe('1d')
    expect(formatAgentTtlLabel(parseAgentRule('[agents:access]'))).toBe('')
    expect(formatAgentTtlLabel(defaultAgentRule())).toBe('')
  })

  it('compares the rule with the signed-in viewer', () => {
    const owner = { ...member, username: 'owner' }
    const board = { ...member, hasExplicitAccess: false, canEditBoard: true }
    const mod = { ...member, hasExplicitAccess: false, canDelete: true }
    const stranger = emptyViewerRights('PEPA')
    expect(canUseAgent(parseAgentRule('[agents:none]'), owner)).toBe(false)
    expect(canUseAgent(parseAgentRule('[agents:owner]'), owner)).toBe(true)
    expect(canUseAgent(parseAgentRule('[agents:owner]'), member)).toBe(false)
    expect(canUseAgent(parseAgentRule('[agents:board]'), board)).toBe(true)
    expect(canUseAgent(parseAgentRule('[agents:board]'), member)).toBe(false)
    expect(canUseAgent(parseAgentRule('[agents:mods]'), mod)).toBe(true)
    expect(canUseAgent(parseAgentRule('[agents:mods]'), board)).toBe(true)
    expect(canUseAgent(parseAgentRule('[agents:access]'), member)).toBe(true)
    expect(canUseAgent(parseAgentRule('[agents:access]'), stranger)).toBe(false)
    expect(canUseAgent(parseAgentRule('[agents:access]'), owner)).toBe(true)
    expect(canUseAgent(defaultAgentRule(), stranger)).toBe(true)
  })

  it('reads viewer rights from the discussion payload', () => {
    const rights = viewerRightsFromDiscussion(
      {
        owner: { user: { username: 'OWNER' } },
        access_right: { discussion_id: 1, days_left: -1 },
        discussion: { ar_edit: false, ar_delete: true },
      },
      'pepa',
    )
    expect(rights).toMatchObject({
      username: 'pepa',
      ownerUsername: 'OWNER',
      canEditBoard: false,
      canDelete: true,
      hasExplicitAccess: true,
    })
  })
})

describe('agent opt-out and nickname scrubber', () => {
  it('skips a post that carries [agents:ignore]', () => {
    expect(postOptsOutOfAgents({ content: 'Ahoj [agents:ignore] tady' })).toBe(true)
    expect(postOptsOutOfAgents({ parsed: { clearText: 'nic' }, content: 'text' })).toBe(false)
    expect(postOptsOutOfAgents({ parsed: { clearText: 'podpis [Agents:Ignore]' } })).toBe(true)
  })

  it('replaces authors, mentions and quote headers, then restores the answer', () => {
    const posts = [
      {
        username: 'BOHOUS',
        content: '<div class="quote-header"><a href="/x">FUXO</a> napsal:</div> @ALICE souhlasí',
        parsed: { clearText: 'FUXO napsal: @ALICE souhlasí a BOHOUS taky' },
      },
    ]
    const names = collectNicknames(posts, ['co napsal BOHOUS a @FOX?'])
    expect(names.map(name => name.toUpperCase()).sort()).toEqual(['ALICE', 'BOHOUS', 'FOX', 'FUXO'])
    const scrubber = createNicknameScrubber(names)
    const hidden = scrubber.apply('BOHOUS odpověděl FUXO a FOX. USER zůstává, protože to není nick z diskuze.')
    expect(hidden).not.toContain('BOHOUS')
    expect(hidden).not.toContain('FUXO')
    expect(hidden).not.toContain('FOX')
    expect(hidden).toContain('USER zůstává')
    expect(hidden).toMatch(/USER_[A-Z0-9]{4}/)
    const token = hidden.match(/USER_[A-Z0-9]{4}/)?.[0] || ''
    expect(scrubber.restore(`Shrnutí ${token.toLowerCase()} sedí.`)).toContain('BOHOUS')
    expect(scrubber.restore(hidden)).toBe('BOHOUS odpověděl FUXO a FOX. USER zůstává, protože to není nick z diskuze.')
  })

  it('does not replace a short nick inside a token or a longer nick', () => {
    const scrubber = createNicknameScrubber(['USER', 'FOX', 'FOXY'])
    const hidden = scrubber.apply('FOX a FOXY a USER')
    expect(hidden.match(/USER_[A-Z0-9]{4}/g)).toHaveLength(3)
    expect(scrubber.restore(hidden)).toBe('FOX a FOXY a USER')
  })

  it('adds the anonymity instruction once', () => {
    const once = withAnonymityInstruction('Buď stručný.')
    expect(once).toContain('USER_XXXX')
    expect(withAnonymityInstruction(once)).toBe(once)
  })
})

describe('sendOpenRouterChat anonymity', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('sends tokens and restores nicknames in the answer', async () => {
    global.fetch = jest.fn(async (_url: string, init: any) => {
      const body = JSON.parse(init.body)
      const userMessage = body.messages[1].content as string
      expect(userMessage).not.toContain('BOHOUS')
      expect(userMessage).not.toContain('co řekl BOHOUS')
      expect(userMessage).toMatch(/@USER_[A-Z0-9]{4}:/)
      expect(body.messages[0].content).toContain('Jména uživatelů jsou anonymizována')
      const token = userMessage.match(/@(USER_[A-Z0-9]{4}):/)?.[1]
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: `Shrnutí ${token} je hotové.` } }],
          usage: { total_tokens: 4 },
        }),
      } as any
    }) as any

    const result = await sendOpenRouterChat({
      apiKey: 'test',
      model: 'test-model',
      userPrompt: 'co řekl BOHOUS',
      discussionId: 7,
      discussionTitle: 'Klub',
      posts: [
        {
          id: 1,
          username: 'BOHOUS',
          inserted_at: '2026-10-04 12:00:00',
          parsed: { clearText: 'Dneska prší.' },
        },
        {
          id: 2,
          username: 'KAREL',
          inserted_at: '2026-10-04 12:05:00',
          content: 'ne [agents:ignore]',
          parsed: { clearText: 'ne [agents:ignore]' },
        },
      ],
    })

    expect(result.content).toBe('Shrnutí BOHOUS je hotové.')
    expect(result.content).not.toMatch(/USER_[A-Z0-9]{4}/)
    const sent = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).messages[1].content as string
    expect(sent).not.toContain('KAREL')
    expect(sent).not.toContain('ne [agents:ignore]')
  })
})

describe('summary copy lock', () => {
  it('locks every summary of a club whose header ttl is non-zero', () => {
    expect(isSummaryCopyLocked({ clubTtlMs: 120_000, sameClub: true })).toBe(true)
    expect(isSummaryCopyLocked({ clubTtlMs: 120_000, sameClub: true, expiresAt: null })).toBe(true)
  })

  it('leaves a permanent summary copyable', () => {
    expect(isSummaryCopyLocked({ clubTtlMs: 0, sameClub: true })).toBe(false)
    expect(isSummaryCopyLocked({ clubTtlMs: 120_000, sameClub: false })).toBe(false)
    expect(isSummaryCopyLocked({})).toBe(false)
  })

  it('locks a saved summary that still carries a deletion time', () => {
    expect(isSummaryCopyLocked({ expiresAt: '2026-10-23T12:00:00.000Z' })).toBe(true)
    expect(isSummaryCopyLocked({ clubTtlMs: 0, sameClub: false, expiresAt: '2026-10-23T12:00:00.000Z' })).toBe(true)
  })
})

describe('ttl countdown', () => {
  it('counts down by day, hour, and minute', () => {
    expect(formatTtlCountdown(86_400_000 + 3 * 3_600_000)).toBe('1 d 3 h')
    expect(formatTtlCountdown(2 * 3_600_000 + 5 * 60_000)).toBe('2 h 5 min')
    expect(formatTtlCountdown(90_000)).toBe('01:30')
    expect(formatTtlCountdown(0)).toBe('00:00')
  })
})
