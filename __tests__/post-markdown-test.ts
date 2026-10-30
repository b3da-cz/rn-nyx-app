import { isPostMarkdown, postCanFormatMarkdown, postHtmlToMarkdown, postHtmlToText } from '../src/lib/postMarkdown'

describe('post markdown', () => {
  it('keeps ordinary text raw', () => {
    expect(isPostMarkdown('Ahoj, jak se máš?')).toBe(false)
    expect(isPostMarkdown('viz https://nyx.cz/discussion/1')).toBe(false)
    expect(postCanFormatMarkdown({ content: '<p>Ahoj <a href="https://nyx.cz">klub</a></p>' })).toBe(false)
  })

  it('recognizes headings, lists, links, bold and tables', () => {
    expect(isPostMarkdown('# Nadpis\ntext')).toBe(true)
    expect(isPostMarkdown('uvod\n\n- bod')).toBe(true)
    expect(isPostMarkdown('viz [klub](https://nyx.cz/x)')).toBe(true)
    expect(isPostMarkdown('tohle je **tučné**')).toBe(true)
    expect(isPostMarkdown('| a | b |\n| --- | --- |\n| 1 | 2 |')).toBe(true)
    expect(isPostMarkdown('```\nkod\n```')).toBe(true)
  })

  it('turns post html into markdown lines and links', () => {
    const html = '<p># Tabulka</p><p>| a | b |<br>| --- | --- |<br>| 1 | 2 |</p><p>viz <a href="/discussion/5/id/9">příspěvek</a></p>'
    expect(postHtmlToText(html)).toBe('# Tabulka\n| a | b |\n| --- | --- |\n| 1 | 2 |\nviz příspěvek')
    expect(postHtmlToMarkdown(html)).toContain('[příspěvek](https://nyx.cz/discussion/5/id/9)')
    expect(postCanFormatMarkdown({ content: html })).toBe(true)
  })

  it('ignores markdown that only lives in a code block or a special post', () => {
    expect(postCanFormatMarkdown({ content: '<pre><code># jen kod</code></pre>' })).toBe(false)
    expect(postCanFormatMarkdown({ content: '# Nadpis', content_raw: { type: 'poll' } })).toBe(false)
    expect(postCanFormatMarkdown({ content: '   ' })).toBe(false)
  })
})