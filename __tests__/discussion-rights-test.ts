import {
  applyRightsResponse,
  isRightsManager,
  foldSearch,
  parseDiscussionRightsPage,
  rightKeysFor,
  rightsLogLabel,
  rightsTableCell,
  searchMatchRanges,
} from '../src/lib/discussionRights'

const PAGE = `
<section id=discussion-rights class="is first-column-icons" data-discussion-type="discussion"><header>přístupová práva</header><main><table><thead><tr><th> <th>přezdívka</thead>
<tbody>
<tr><td><img src='/B/B3DA.gif' class='i im' alt='B3DA' title='B3DA'><td><a href='/profile/B3DA'>B3DA</a><td colspan=6>majitel diskuze</tr>
<tr data-username="BURKHAR"><td><img src='/B/BURKHAR.gif' alt='BURKHAR'><td><a href='/profile/BURKHAR'>BURKHAR</a>
<td><input type=checkbox data-right="read" checked=checked disabled>
<td><input type=checkbox data-right="write" disabled>
<td><input type=checkbox data-right="delete" disabled>
<td><input type=checkbox data-right="edit" disabled>
<td><input type=checkbox data-right="edit_rights" disabled>
<td><input type=number name=days_left value="-1" disabled min=-1 max=3650 size=3></tr>
<tr><td><td>přihlášení uživatelé
<td><input type=checkbox data-right="read" checked=checked disabled>
<td><input type=checkbox data-right="write" checked=checked disabled>
<td><input type=checkbox data-right="delete" disabled>
<td><input type=checkbox data-right="edit" disabled></tr>
<tr><td><td>nepřihlášení<td><input type=checkbox data-right="public" disabled></tr>
</tbody></table></main></section>
<section id=discussion-log><header>výpis změn</header>
<div class=dp>9.6.2021</div>
<div class=ar-change>
<img alt='B3DA'><a href='/profile/B3DA'>B3DA</a>
<span class=removed><span class='icon-entypo icon-minus'></span>veřejný přístup</span>
<img alt='BURKHAR'><a href='/profile/BURKHAR'>BURKHAR</a>
<span class=removed><span class='icon-entypo icon-minus'></span>právo zápisu</span>
<span class=added><span class='icon-entypo icon-plus'></span>přidán do práv (∞ dní)</span>
</div>
</section>`

const EDITABLE = PAGE.replace(/disabled/g, '')

describe('parseDiscussionRightsPage', () => {
  it('reads the website rights table', () => {
    const page = parseDiscussionRightsPage(PAGE)
    expect(page.canEdit).toBe(false)
    expect(page.rows.map(row => row.kind)).toEqual(['owner', 'user', 'registered', 'public'])
    expect(page.rows[0].username).toBe('B3DA')
    expect(isRightsManager(page.rows[0])).toBe(true)
    expect(page.rows[0].rights).toEqual({
      read: true,
      write: true,
      delete: true,
      edit: true,
      edit_rights: true,
    })
    expect(page.rows[1].username).toBe('BURKHAR')
    expect(page.rows[1].rights.read).toBe(true)
    expect(page.rows[1].rights.write).toBe(false)
    expect(page.rows[1].daysLeft).toBe(-1)
    expect(isRightsManager(page.rows[1])).toBe(false)
    expect(page.rows[2].rights).toMatchObject({ read: true, write: true, delete: false, edit: false })
    expect(rightKeysFor(page.rows[2])).toEqual(['read', 'write', 'delete', 'edit'])
    expect(page.rows[3].rights.public).toBe(false)
    expect(rightKeysFor(page.rows[3])).toEqual(['public'])
    expect(rightsTableCell(page.rows[3], 'read')).toBe(false)
    expect(rightsTableCell(page.rows[3], 'write')).toBeNull()
    expect(rightsTableCell(page.rows[2], 'edit_rights')).toBeNull()
    expect(rightsTableCell(page.rows[1], 'read')).toBe(true)
    expect(rightsTableCell(page.rows[1], 'write')).toBe(false)
  })

  it('marks the page editable when checkboxes are enabled', () => {
    const page = parseDiscussionRightsPage(EDITABLE)
    expect(page.canEdit).toBe(true)
    expect(page.rows[1].editable).toBe(true)
    expect(page.rows[0].editable).toBe(false)
  })

  it('reads a table log with the date above one actor', () => {
    const table = `
<section id=discussion-log><header>výpis změn</header><table>
<tr><th>provedl<th>akce
<tr><td colspan=2>9.6.2021 07:28:15
<tr><td><img alt='B3DA' src='/B/B3DA.gif'><a href='https://nyx.cz/profile/B3DA'>B3DA</a>
<td>
<div class=ar-change><span class=removed><span class='icon-entypo icon-minus'></span>veřejný přístup</span></div>
<div class=ar-change><span><img alt='BURKHAR'><a href='https://nyx.cz/profile/BURKHAR'>BURKHAR</a></span>
<span class=removed><span class='icon-entypo icon-minus'></span>právo zápisu<span class='icon-entypo icon-plus'></span>přidán do práv (∞ dní)</span>
</div>
</table></section>`
    expect(parseDiscussionRightsPage(table).log).toEqual([
      {
        date: '9.6.2021 07:28:15',
        entries: [
          {
            username: 'B3DA',
            actions: [
              { op: 'remove', label: 'veřejný přístup', username: undefined },
              { op: 'remove', label: 'právo zápisu', username: 'BURKHAR' },
              { op: 'add', label: 'přidán do práv (∞ dní)', username: 'BURKHAR' },
            ],
          },
        ],
      },
    ])
  })

  it('reads a date split across tags in a header cell', () => {
    const html = `
<section id=discussion-log><header>výpis změn</header><table>
<tr><th>provedl<th>akce
<tr><th colspan=2><span>9</span>.<span>6</span>.<span>2021</span>
<tr><td><img alt='B3DA'><a href='/profile/B3DA'>B3DA</a>
<td><span class=removed>veřejný přístup</span>
</table></section>`
    const log = parseDiscussionRightsPage(html).log
    expect(log[0].date).toBe('9.6.2021')
    expect(log[0].entries[0].username).toBe('B3DA')
    expect(log[0].entries[0].actions[0].label).toBe('veřejný přístup')
  })

  it('keeps a date that sits outside the log table or next to the actor', () => {
    const beside = `
<section id=discussion-log><header>výpis změn</header>
<div class=dp><span>9.6.2021</span> <span>07:28:15</span></div>
<table>
<tr><th>provedl<th>akce
<tr><td><img alt='B3DA'><a href='/profile/B3DA'>B3DA</a>
<td><span class=removed>veřejný přístup</span>
</table></section>`
    expect(parseDiscussionRightsPage(beside).log[0].date).toBe('9.6.2021 07:28:15')

    const inCell = `
<section id=discussion-log><header>výpis změn</header><table>
<tr><th>provedl<th>akce
<tr><td><img alt='B3DA'><a href='/profile/B3DA'>B3DA</a><span class=dp>14.10.2026 09:34</span>
<td><span class="removed">veřejný přístup</span>
</table></section>`
    expect(parseDiscussionRightsPage(inCell).log[0].date).toBe('14.10.2026 09:34')
    expect(parseDiscussionRightsPage(inCell).log[0].entries[0].username).toBe('B3DA')
  })

  it('reads a log action whose label sits on the removed element', () => {
    const html = `
<section id=discussion-log><header>výpis změn</header>
<div class=dp>9.6.2021</div>
<div class=ar-change>
<img alt='B3DA'><a href='/profile/B3DA'>B3DA</a>
<span class="removed">veřejný přístup</span>
<span class="removed icon-minus">právo zápisu</span>
</div>
</section>`
    expect(parseDiscussionRightsPage(html).log).toEqual([
      {
        date: '9.6.2021',
        entries: [
          {
            username: 'B3DA',
            actions: [
              { op: 'remove', label: 'veřejný přístup', username: undefined },
              { op: 'remove', label: 'právo zápisu', username: undefined },
            ],
          },
        ],
      },
    ])
  })

  it('reads the change log when the page includes it', () => {
    const page = parseDiscussionRightsPage(PAGE)
    expect(page.log).toEqual([
      {
        date: '9.6.2021',
        entries: [
          {
            username: 'B3DA',
            actions: [
              { op: 'remove', label: 'veřejný přístup', username: undefined },
              { op: 'remove', label: 'právo zápisu', username: 'BURKHAR' },
              { op: 'add', label: 'přidán do práv (∞ dní)', username: 'BURKHAR' },
            ],
          },
        ],
      },
    ])
  })

  it('returns an empty page when the rights section is missing', () => {
    expect(parseDiscussionRightsPage('<html></html>')).toEqual({ rows: [], log: [], canEdit: false })
  })
})

describe('applyRightsResponse', () => {
  const row = parseDiscussionRightsPage(EDITABLE).rows[1]

  it('keeps a user row in sync with the access-right payload', () => {
    const next = applyRightsResponse(row, {
      ar_read: true,
      ar_write: true,
      ar_delete: true,
      ar_edit: false,
      ar_rights: false,
      days_left: 12,
    })
    expect(next.rights.write).toBe(true)
    expect(next.rights.delete).toBe(true)
    expect(next.daysLeft).toBe(12)
    expect(isRightsManager(next)).toBe(true)
  })

  it('keeps global flags from the global payload', () => {
    const registered = parseDiscussionRightsPage(EDITABLE).rows[2]
    const next = applyRightsResponse(registered, { read: true, write: false, delete: false, edit: true, public: false })
    expect(next.rights.write).toBe(false)
    expect(next.rights.edit).toBe(true)
  })

  it('leaves the row unchanged when the call failed', () => {
    expect(applyRightsResponse(row, { error: 'nope' })).toBe(row)
  })
})

describe('foldSearch', () => {
  it('matches Czech letters without diacritics', () => {
    expect(foldSearch('ščřžýáíéě')).toBe('scrzyaiee')
    expect(foldSearch('ŠČŘŽÝÁÍÉĚ').includes(foldSearch('scrzy'))).toBe(true)
    expect(foldSearch('B3DA').includes(foldSearch('b3da'))).toBe(true)
    expect(searchMatchRanges('Šárka', 'sar')).toEqual([[0, 3]])
    const name = 'přihlášení'
    const [start, end] = searchMatchRanges(name, 'prihl')[0]
    expect(name.slice(start, end)).toBe('přihl')
  })
})

describe('rightsLogLabel', () => {
  it('shows an edit-board change as board management', () => {
    expect(rightsLogLabel('změna práv', 'správa nástěnky')).toBe('správa nástěnky')
    expect(rightsLogLabel('zmena prav', 'správa nástěnky')).toBe('správa nástěnky')
    expect(rightsLogLabel('právo zápisu', 'správa nástěnky')).toBe('právo zápisu')
  })
})
