import { isListingDiscussion } from '../src/lib/Filtering'

describe('isListingDiscussion', () => {
  it('treats a market title as a listing even before posts arrive', () => {
    expect(isListingDiscussion('nyx :: tržiště', [])).toBe(true)
  })

  it('treats loaded event and advertisement posts as a listing', () => {
    expect(isListingDiscussion('nyx :: nove udalosti', [{ content_raw: { type: 'event' } }])).toBe(true)
    expect(
      isListingDiscussion('bazar', [
        { content_raw: { type: 'advertisement' } },
        { content_raw: { type: 'log_message' } },
      ]),
    ).toBe(true)
    expect(isListingDiscussion('bazar', [{ post_type: 'advertisement' }])).toBe(true)
  })

  it('keeps a normal discussion and an event detail writable', () => {
    expect(
      isListingDiscussion('Samurai Breaks', [{ content_raw: { type: 'text' } }, { content_raw: { type: 'log_message' } }]),
    ).toBe(false)
    expect(isListingDiscussion('', [])).toBe(false)
    expect(isListingDiscussion(null, null)).toBe(false)
  })
})
