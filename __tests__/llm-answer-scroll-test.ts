import { followAfterUserScroll, isNearAnswerEnd, isUnwantedTopJump } from '../src/component/llm/llmAnswerScroll'

describe('assistant answer autoscroll', () => {
  const viewport = 800
  const content = 2400

  it('treats the last lines as the end', () => {
    expect(isNearAnswerEnd(1600, viewport, content)).toBe(true)
    expect(isNearAnswerEnd(1536, viewport, content)).toBe(true)
    expect(isNearAnswerEnd(1500, viewport, content)).toBe(false)
  })

  it('follows until the reader moves up, then follows again at the end', () => {
    expect(followAfterUserScroll(1500, viewport, content, true, true)).toBe(false)
    expect(followAfterUserScroll(1600, viewport, content, true, false)).toBe(true)
    expect(followAfterUserScroll(1500, viewport, content, false, true)).toBe(true)
  })

  it('keeps a layout jump back to the top from counting as reading the top', () => {
    expect(isUnwantedTopJump(0, 1600, viewport, content, false)).toBe(true)
    expect(isUnwantedTopJump(0, 1600, viewport, content, true)).toBe(false)
    expect(isUnwantedTopJump(0, 40, viewport, content, false)).toBe(false)
    expect(isUnwantedTopJump(0, 1600, viewport, 860, false)).toBe(false)
  })
})
