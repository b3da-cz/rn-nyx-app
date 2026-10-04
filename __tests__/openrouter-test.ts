import {
  DEFAULT_LLM_SYSTEM_PROMPT,
  filterAndFormatPostsForLlm,
  formatPricing,
  RECOMMENDED_MODEL_IDS,
} from '../src/lib/OpenRouter'

describe('OpenRouter helper tests', () => {
  describe('formatPricing', () => {
    it('returns empty string for undefined or missing pricing', () => {
      expect(formatPricing()).toBe('')
      expect(formatPricing(undefined)).toBe('')
    })

    it('returns Zdarma / Free for zero prices', () => {
      expect(formatPricing({ prompt: '0', completion: '0' })).toBe('Zdarma / Free')
      expect(formatPricing({ prompt: '0.0', completion: '0.00' })).toBe('Zdarma / Free')
    })

    it('formats per 1M tokens accurately', () => {
      // 0.0000001 per token = $0.10 per 1M
      // 0.0000004 per token = $0.40 per 1M
      const res = formatPricing({ prompt: '0.0000001', completion: '0.0000004' })
      expect(res).toBe('$0.10 / $0.40 per 1M')
    })

    it('formats fractional and higher prices', () => {
      // 0.0000025 per token = $2.50 per 1M
      // 0.00001 per token = $10.00 per 1M
      const res = formatPricing({ prompt: '0.0000025', completion: '0.00001' })
      expect(res).toBe('$2.50 / $10.00 per 1M')
    })
  })

  describe('filterAndFormatPostsForLlm', () => {
    const samplePosts = [
      {
        id: 103,
        username: 'alice',
        inserted_at: '2026-10-04 14:00:00',
        parsed: { clearText: 'Třetí příspěvek z dneška' },
      },
      {
        id: 102,
        username: 'bob',
        inserted_at: '2026-10-03 12:30:00',
        parsed: { clearText: 'Druhý příspěvek ze včerejška' },
      },
      {
        id: 101,
        username: 'charlie',
        inserted_at: '2026-10-01 09:15:00',
        parsed: { clearText: 'První starý příspěvek' },
      },
      {
        id: 100,
        username: 'system',
        location: 'header',
        inserted_at: '2026-10-04 08:00:00',
        parsed: { clearText: 'Záhlaví diskuze' },
      },
    ]

    it('filters out header and home location posts', () => {
      const res = filterAndFormatPostsForLlm(samplePosts, undefined, undefined, 'Test Klub')
      expect(res.count).toBe(3)
      expect(res.formattedText).not.toContain('Záhlaví diskuze')
    })

    it('sorts posts chronologically (oldest first)', () => {
      const res = filterAndFormatPostsForLlm(samplePosts, undefined, undefined, 'Test Klub')
      expect(res.matchedPosts[0].id).toBe(101)
      expect(res.matchedPosts[1].id).toBe(102)
      expect(res.matchedPosts[2].id).toBe(103)
      expect(res.formattedText.indexOf('charlie')).toBeLessThan(res.formattedText.indexOf('alice'))
    })

    it('filters correctly by date range', () => {
      // Only 2026-10-03 to 2026-10-04
      const res = filterAndFormatPostsForLlm(samplePosts, '2026-10-03', '2026-10-04', 'Test Klub')
      expect(res.count).toBe(2)
      expect(res.matchedPosts.map(p => p.id)).toEqual([102, 103])
    })

    it('filters correctly for single day', () => {
      const res = filterAndFormatPostsForLlm(samplePosts, '2026-10-04', '2026-10-04', 'Test Klub')
      expect(res.count).toBe(1)
      expect(res.matchedPosts[0].id).toBe(103)
      expect(res.formattedText).toContain('@alice: Třetí příspěvek z dneška')
    })

    it('returns empty result when no posts match', () => {
      const res = filterAndFormatPostsForLlm(samplePosts, '2026-09-01', '2026-09-02', 'Test Klub')
      expect(res.count).toBe(0)
      expect(res.wordCount).toBe(0)
    })
  })

  describe('RECOMMENDED_MODEL_IDS', () => {
    it('contains top models', () => {
      expect(RECOMMENDED_MODEL_IDS).toContain('google/gemini-2.5-flash')
      expect(RECOMMENDED_MODEL_IDS).toContain('anthropic/claude-3.5-haiku')
      expect(RECOMMENDED_MODEL_IDS.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('DEFAULT_LLM_SYSTEM_PROMPT', () => {
    it('contains post linking instructions with discussion and post id placeholders', () => {
      expect(DEFAULT_LLM_SYSTEM_PROMPT).toContain('{discussion_id}')
      expect(DEFAULT_LLM_SYSTEM_PROMPT).toContain('{post_id}')
      expect(DEFAULT_LLM_SYSTEM_PROMPT).toContain('Markdown')
    })
  })
})
