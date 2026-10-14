import {
  fileNameFromUrl,
  highlightSourceLine,
  sourceLangFor,
  splitByRanges,
  textFileKind,
  TEXT_FILE_MAX_BYTES,
} from '../src/lib/textFile'

describe('textFileKind', () => {
  it('reads the extension from the url or the link text', () => {
    expect(textFileKind('https://nyx.cz/files/notes.MD?x=1')).toBe('md')
    expect(textFileKind('https://nyx.cz/file/123', 'export.csv')).toBe('csv')
    expect(textFileKind('https://nyx.cz/file/123', 'readme')).toBeNull()
    expect(textFileKind('/tmp/app.js')).toBe('js')
    expect(textFileKind('https://example.com/a.log')).toBe('log')
    expect(textFileKind('https://example.com/a.JSON')).toBe('json')
    expect(textFileKind('https://example.com/a.txt')).toBe('txt')
  })

  it('keeps a readable name', () => {
    expect(fileNameFromUrl('https://nyx.cz/file/9', 'plan.md')).toBe('plan.md')
    expect(fileNameFromUrl('https://cdn.example/data.json')).toBe('data.json')
  })
})

describe('highlightSourceLine', () => {
  it('marks javascript words and strings', () => {
    const spans = highlightSourceLine('const name = "nyx"', 'js')
    expect(spans.map(span => span.kind)).toEqual(['keyword', 'plain', 'string'])
    expect(spans[0].text).toBe('const')
    expect(spans[2].text).toBe('"nyx"')
  })

  it('marks json keys apart from strings', () => {
    const spans = highlightSourceLine('{"days": 12}', 'json')
    expect(spans.find(span => span.kind === 'key')?.text).toBe('"days"')
    expect(spans.find(span => span.kind === 'number')?.text).toBe('12')
  })

  it('uses plain text until parsed mode asks for a language', () => {
    expect(sourceLangFor('js', false)).toBe('text')
    expect(sourceLangFor('md', true)).toBe('text')
    expect(sourceLangFor('csv', true)).toBe('csv')
    expect(sourceLangFor('log', true)).toBe('log')
  })
})

describe('splitByRanges', () => {
  it('splits a span around a hit that starts before it', () => {
    expect(splitByRanges('world', [[-2, 3]])).toEqual([
      { text: 'wor', hit: true },
      { text: 'ld', hit: false },
    ])
    expect(TEXT_FILE_MAX_BYTES).toBe(1_500_000)
  })
})
