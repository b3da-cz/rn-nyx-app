import {
  isNotepadEditorUrl,
  NOTEPAD_CREATE_URL,
  notepadBody,
  notepadEditUrl,
  notepadEntries,
  notepadEntriesFromHtml,
  notepadEntriesFromWebMessage,
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

  it('opens create and edit only on the notepad pages', () => {
    expect(NOTEPAD_CREATE_URL).toBe('https://nyx.cz/notepad/create')
    expect(notepadEditUrl(99845)).toBe('https://nyx.cz/notepad/99845/edit')
    expect(isNotepadEditorUrl(NOTEPAD_CREATE_URL)).toBe(true)
    expect(isNotepadEditorUrl('https://nyx.cz/notepad/99845/edit')).toBe(true)
    expect(isNotepadEditorUrl('https://nyx.cz/notepad/99845')).toBe(false)
    expect(isNotepadEditorUrl('https://example.com/notepad/create')).toBe(false)
  })
})
