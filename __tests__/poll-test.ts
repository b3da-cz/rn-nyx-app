import {
  attachPollMedia,
  isPollTextPart,
  pollAnswers,
  pollContentBlocks,
  pollContentHeight,
  pollHtmlImages,
  pollIsClosed,
  pollLayoutModel,
  pollPlainText,
} from '../src/lib/poll'

const img =
  '<img src="https://nyx.cz/files/000/031/3156362_bc302107959bbdf002fb/original.jpg?name=IMG-20261027-WA0000.jpg">'

describe('poll html', () => {
  it('turns an instructions image into a file url and empty caption', () => {
    expect(pollHtmlImages(img).map(image => image.src)).toEqual([
      'https://nyx.cz/files/000/031/3156362_bc302107959bbdf002fb/original.jpg?name=IMG-20261027-WA0000.jpg',
    ])
    expect(pollPlainText(img)).toBe('')
    expect(pollPlainText('Vlevo')).toBe('Vlevo')
    expect(pollPlainText('první<br>druhý řádek')).toBe('první\ndruhý řádek')
    expect(pollPlainText('<p>Vlevo</p><p>druhý</p>')).toBe('Vlevo\ndruhý')
  })

  it('keeps a relative nyx file on the https host', () => {
    expect(pollHtmlImages('<img src="/files/a.jpg">')[0].src).toBe('https://nyx.cz/files/a.jpg')
  })

  it('attaches images from the question, instructions, and answers', () => {
    const post = {
      id: 9,
      post_type: 'poll',
      content: '<div class="pc pc-poll"></div>',
      content_raw: {
        type: 'poll',
        data: {
          question: 'Jak je to správně?',
          instructions: img,
          answers: {
            '1': { answer: 'Vlevo' },
            '2': { answer: `Vpravo<br>${img}` },
          },
          computed_values: { user_did_vote: false, total_votes: 0, total_respondents: 0 },
        },
      },
      parsed: {},
    }
    attachPollMedia(post)
    expect(post.parsed.images.map(image => image.src)).toEqual([
      'https://nyx.cz/files/000/031/3156362_bc302107959bbdf002fb/original.jpg?name=IMG-20261027-WA0000.jpg',
      'https://nyx.cz/files/000/031/3156362_bc302107959bbdf002fb/original.jpg?name=IMG-20261027-WA0000.jpg',
    ])
    expect(post.parsed.pollPlain).toEqual({
      question: 'Jak je to správně?',
      instructions: '',
      answers: ['Vlevo', 'Vpravo'],
    })
    const sized = { ...post.parsed.images[0], width: 20, height: 10 }
    post.parsed.images = [sized]
    attachPollMedia(post)
    expect(post.parsed.images[0].width).toBe(20)
  })

  it('keeps images out of the text run', () => {
    const blocks = pollContentBlocks(['Jak je to správně?', '###I#1', 'Vlevo'])
    expect(blocks.map(block => block.isText)).toEqual([true, false, true])
    expect(isPollTextPart('###I#x')).toBe(false)
    expect(isPollTextPart('###L#x')).toBe(true)
    expect(isPollTextPart('###TB#x')).toBe(true)
    expect(isPollTextPart('###Y#x')).toBe(false)
    expect(isPollTextPart('Vlevo')).toBe(true)
  })

  it('grows the reserved height when an answer wraps', () => {
    const short = pollContentHeight({
      questionHeight: 20,
      answerHeights: [18, 18],
      canVote: true,
      fontScale: 1,
    })
    const wrapped = pollContentHeight({
      questionHeight: 20,
      answerHeights: [18, 240],
      canVote: true,
      fontScale: 1,
    })
    expect(wrapped).toBeGreaterThan(short + 150)
  })

  it('keeps a finished poll from accepting votes', () => {
    const now = Date.parse('2026-10-27T12:00:00Z')
    const base = {
      question: 'Q',
      answers: { '1': { answer: 'A' } },
      computed_values: { user_did_vote: false, total_votes: 0, total_respondents: 0 },
    }
    const ended = {
      ...base,
      allow_answers_until: '2026-01-29T09:10:10.510142840',
    }
    expect(pollIsClosed(ended, now)).toBe(true)
    expect(pollIsClosed({ ...base, allow_answers_until: '2027-01-01T00:00:00' }, now)).toBe(false)
    expect(pollIsClosed(base, now)).toBe(false)
    const closed = pollLayoutModel({ content_raw: { data: ended } }, now)
    expect(closed.canVote).toBe(false)
    expect(closed.showVoteButton).toBe(true)
    const open = pollLayoutModel(
      { content_raw: { data: { ...base, allow_answers_until: '2027-01-01T00:00:00' } } },
      now,
    )
    expect(open.canVote).toBe(true)
    expect(open.showVoteButton).toBe(true)
    const voted = pollLayoutModel(
      { content_raw: { data: { ...base, computed_values: { user_did_vote: true } } } },
      now,
    )
    expect(voted.canVote).toBe(false)
    expect(voted.showVoteButton).toBe(false)
  })

  it('reads answer objects and arrays', () => {
    expect(pollAnswers({ '1': { answer: 'Vlevo', result: { respondents_count: 2 } } })).toEqual([
      { key: '1', answer: 'Vlevo', result: { respondents_count: 2 } },
    ])
    expect(pollAnswers([{ answer: 'Ne' }])[0].key).toBe('0')
  })
})
