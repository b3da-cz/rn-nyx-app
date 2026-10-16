import {
  isNotepadEditorUrl,
  NOTEPAD_CREATE_URL,
  notepadBody,
  notepadCodeKind,
  notepadEditUrl,
  notepadPlainUrl,
  notepadReaderUrl,
  notepadEntries,
  notepadEntriesFromHtml,
  notepadEntriesFromWebMessage,
  notepadSections,
  notepadSelected,
  sortedNotepadEntries,
} from '../src/lib/notepad'

describe('notepad', () => {
  it('reads the list and either response shape for a detail', () => {
    expect(notepadEntries(undefined)).toEqual([])
    expect(notepadEntries({ entries: [{ id: 2, title: 'b' }, { id: 9, title: 'a' }] }).map(entry => entry.id)).toEqual([
      2, 9,
    ])
    expect(
      sortedNotepadEntries([
        { id: 1, updated_at: '2026-01-01T00:00:00Z' },
        { id: 2, updated_at: '2026-03-01T00:00:00Z' },
      ]).map(entry => entry.id),
    ).toEqual([2, 1])
    expect(notepadSelected({ selected_entry: { id: 4, content_raw: 'ahoj' } })?.id).toBe(4)
    expect(notepadSelected({ id: 5, content: '<p>x</p>' })?.id).toBe(5)
    expect(notepadSelected({ entries: [] })).toBeNull()
    expect(notepadEntries({ categories: [{ entries: [{ entry_id: 7, name: 'ze skupiny' }] }] })[0]).toMatchObject({
      id: 7,
      title: 'ze skupiny',
    })
    expect(notepadEntries({ entries: [{ id: 1, title: 'verejna', public: true }] })[0]?.public).toBe(true)
    expect(notepadEntries({ entries: [{ id: 2, title: 'soukroma', public: 0 }] })[0]?.public).toBe(false)
    expect(
      notepadEntries({
        entries: [
          {
            category: { id: -1, category_name: 'nezařazené poznámky' },
            entries: [
              { id: 3, title: 'aaa', public: true, updated_at: '2026-10-16T09:54:12' },
              { id: 4, title: 'bbb', public: false, updated_at: '2026-10-15T11:57:46' },
            ],
          },
        ],
      }).map(entry => [entry.id, entry.public, entry.updated_at]),
    ).toEqual([
      [3, true, '2026-10-16T09:54:12'],
      [4, false, '2026-10-15T11:57:46'],
    ])
    expect(
      notepadSections({
        entries: [
          {
            category: { id: -1, category_name: 'nezařazené poznámky' },
            entries: [{ id: 1, title: 'volná', updated_at: '2026-10-16T00:00:00' }],
          },
          {
            category: { id: 5, category_name: 'Práce' },
            entries: [
              { id: 8, title: 'starší', updated_at: '2026-01-01T00:00:00' },
              { id: 9, title: 'novější', updated_at: '2026-03-01T00:00:00' },
            ],
          },
        ],
      }).map(section => [section.title, section.uncategorized, section.entries.map(entry => entry.id)]),
    ).toEqual([
      ['Práce', false, [9, 8]],
      ['nezařazené poznámky', true, [1]],
    ])
  })

  it('reads the website list when the api payload has no entries', () => {
    const html = `
      <div class=notepad-entry data-entry-id=99845>
        <a href=/notepad/99845>Nákup</a>
      </div>
      <a href="/notepad/12/edit">upravit</a>
      <a href="/notepad/12">Druhá</a>
    `
    expect(notepadEntriesFromHtml(html).map(entry => [entry.id, entry.title])).toEqual([
      [99845, 'Nákup'],
      [12, 'Druhá'],
    ])
    const marked = `
      <div class=notepad-entry data-entry-id=1><span class=icon-lock></span><a href=/notepad/1>Soukromá</a></div>
      <div class="notepad-entry public" data-entry-id="2"><a href="/notepad/2">Veřejná</a></div>
    `
    expect(notepadEntriesFromHtml(marked).map(entry => [entry.id, entry.public])).toEqual([
      [1, false],
      [2, true],
    ])
    expect(notepadEntries({ data: { entries: [{ id: 3, title: 'obalené' }] } })[0]?.title).toBe('obalené')
    expect(
      notepadEntriesFromWebMessage(JSON.stringify({ entries: [{ id: 99845, title: 'Nákup' }], done: true })).map(
        entry => entry.id,
      ),
    ).toEqual([99845])
  })

  it('shows the raw note and falls back to stripped html', () => {
    expect(notepadBody({ content_raw: '  text  ', content: '<p>html</p>' })).toBe('  text  ')
    expect(notepadBody({ content: '<p>Ahoj<br>světe</p>' })).toBe('Ahoj\nsvěte')
  })

  it('builds the plain and reader share links', () => {
    expect(notepadPlainUrl(99845)).toBe('https://nyx.cz/notepad/99845')
    expect(notepadReaderUrl(99845)).toBe('https://nyx.cz/notepad/99845/reader')
  })

  it('picks a file view when the note is code or only partly markdown', () => {
    expect(notepadCodeKind('obycejny text')).toBeNull()
    expect(notepadCodeKind('{"a":1}')).toBe('json')
    expect(notepadCodeKind('uvod\n\n# Nadpis\n- bod')).toBe('md')
    expect(notepadCodeKind('text\n\n```json\n{"a":1}\n```')).toBe('md')
    expect(notepadCodeKind('const a = 1\nfunction b() {\n  return a\n}')).toBe('js')
    expect(notepadCodeKind('a,b\n1,2\n3,4')).toBe('csv')
  })

  it('opens create and edit only on the notepad pages', () => {
    expect(NOTEPAD_CREATE_URL).toBe('https://nyx.cz/notepad/create')
    expect(notepadEditUrl(99845)).toBe('https://nyx.cz/notepad/99845/edit')
    expect(isNotepadEditorUrl(NOTEPAD_CREATE_URL)).toBe(true)
    expect(isNotepadEditorUrl('https://nyx.cz/notepad/99845/edit')).toBe(true)
    expect(isNotepadEditorUrl('https://nyx.cz/notepad/99845')).toBe(false)
    expect(isNotepadEditorUrl('https://example.com/notepad/create')).toBe(false)
  })
})
