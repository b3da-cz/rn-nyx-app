import {
  discussionRequestBlockHeight,
  discussionRequestFromPost,
  discussionRequestLinks,
} from '../src/lib/discussionRequest'

const html = `
<table>
<tr><td>název<td><a href="/discussion/44">Hotový klub</a>
<tr><td>kategorie<td>Zájmy / Test
<tr><td>popis<td>Řádek popisu<br>druhý
<tr><td>podobné<td><a href="/discussion/12">Jiný klub</a>
<tr><td>akce<td><button type=button name=vote_for>hlas pro</button><button type=button name=vote_against>hlas proti</button>
</table>`

describe('discussion request', () => {
  it('reads structured content_raw and keeps the vote open until the club exists', () => {
    const view = discussionRequestFromPost({
      content_raw: {
        type: 'discussion_request',
        data: {
          name_static: 'Nový klub',
          category_path: 'Zájmy / Něco',
          summary: 'Popis',
          similar_discussions: '<a href="/discussion/9">Starší</a>',
          can_vote: true,
          computed_values: { voters_positive_total: 4, voters_negative_total: 1 },
        },
      },
    })
    expect(view).toMatchObject({
      name: 'Nový klub',
      category: 'Zájmy / Něco',
      summary: 'Popis',
      canVote: true,
      votesFor: 4,
      votesAgainst: 1,
      discussionId: null,
    })
    expect(view?.links).toEqual([{ id: 9, name: 'Starší' }])
  })

  it('hides the vote once the club exists or the request is cancelled', () => {
    expect(
      discussionRequestFromPost({
        content_raw: { type: 'discussion_request', data: { name_static: 'A', discussion_id: 15, can_vote: true } },
      })?.canVote,
    ).toBe(false)
    expect(
      discussionRequestFromPost({
        content_raw: { type: 'discussion_request', data: { name_static: 'A', cancelled: true, can_vote: true } },
      })?.canVote,
    ).toBe(false)
    expect(
      discussionRequestFromPost({
        content_raw: {
          type: 'discussion_request',
          data: { name_static: 'A', discussion_id: 15, computed_values: { voters_positive_total: 2, voters_negative_total: 8 } },
        },
      }),
    ).toMatchObject({ discussionId: 15, votesFor: 2, votesAgainst: 8 })
  })

  it('falls back to the HTML table when content_raw has no data', () => {
    const view = discussionRequestFromPost({
      post_type: 'discussion_request',
      parsed: { discussionRequest: html },
    })
    expect(view).toMatchObject({
      name: 'Hotový klub',
      category: 'Zájmy / Test',
      summary: 'Řádek popisu\ndruhý',
      discussionId: 44,
      canVote: false,
    })
    expect(discussionRequestLinks('<a href="/discussion/12">Jiný klub</a>')).toEqual([{ id: 12, name: 'Jiný klub' }])
  })

  it('keeps an open vote when the HTML still has the vote buttons and no club link', () => {
    const open = html.replace('<a href="/discussion/44">Hotový klub</a>', 'Čerstvá žádost')
    const view = discussionRequestFromPost({ content: open, post_type: 'discussion_request' })
    expect(view?.canVote).toBe(true)
    expect(view?.name).toBe('Čerstvá žádost')
    expect(view?.links).toEqual([{ id: 12, name: 'Jiný klub' }])
  })

  it('reserves label and button space on top of the measured text', () => {
    const open = discussionRequestFromPost({
      content_raw: { type: 'discussion_request', data: { name_static: 'A', can_vote: true } },
    })!
    const closed = { ...open, canVote: false, discussionId: 3 }
    expect(discussionRequestBlockHeight(open, 100, 1)).toBe(100 + 4 * 22 + 4 * 10 + 126 + 8)
    expect(discussionRequestBlockHeight({ ...open, links: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] }, 100, 1)).toBe(
      100 + 4 * 22 + 4 * 10 + 126 + 2 * 24 + 8,
    )
    expect(discussionRequestBlockHeight(closed, 40, 2)).toBe(40 + 3 * 22 * 2 + 3 * 10 * 2 + 28 * 2 + 8 * 2)
  })
})