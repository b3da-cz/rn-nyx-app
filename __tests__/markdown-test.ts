import {
  parseMarkdownBlocks,
  tokenizeInlineMarkdown,
} from '../src/lib/MarkdownParser'

describe('MarkdownViewComponent parser tests', () => {
  describe('parseMarkdownBlocks', () => {
    it('returns empty array for empty or undefined markdown', () => {
      expect(parseMarkdownBlocks('')).toEqual([])
      expect(parseMarkdownBlocks(null as any)).toEqual([])
      expect(parseMarkdownBlocks(undefined as any)).toEqual([])
    })

    it('parses headers with various levels', () => {
      const md = '# Header 1\n## Header 2\n### Header 3'
      const blocks = parseMarkdownBlocks(md)
      expect(blocks.length).toBe(3)
      expect(blocks[0]).toEqual({ type: 'header', level: 1, content: 'Header 1' })
      expect(blocks[1]).toEqual({ type: 'header', level: 2, content: 'Header 2' })
      expect(blocks[2]).toEqual({ type: 'header', level: 3, content: 'Header 3' })
    })

    it('parses fenced code blocks', () => {
      const md = '```ts\nconst x = 1;\nconsole.log(x);\n```'
      const blocks = parseMarkdownBlocks(md)
      expect(blocks.length).toBe(1)
      expect(blocks[0]).toEqual({
        type: 'code_block',
        lang: 'ts',
        content: 'const x = 1;\nconsole.log(x);',
      })
    })

    it('parses blockquotes', () => {
      const md = '> Citace z diskuze'
      const blocks = parseMarkdownBlocks(md)
      expect(blocks.length).toBe(1)
      expect(blocks[0]).toEqual({
        type: 'blockquote',
        content: 'Citace z diskuze',
      })
    })

    it('parses unordered and ordered list items', () => {
      const md = '- Odrážka jedna\n* Odrážka dvě\n1. První číslované\n2. Druhé číslované'
      const blocks = parseMarkdownBlocks(md)
      expect(blocks.length).toBe(4)
      expect(blocks[0]).toEqual({ type: 'list_item', ordered: false, indent: 0, content: 'Odrážka jedna' })
      expect(blocks[1]).toEqual({ type: 'list_item', ordered: false, indent: 0, content: 'Odrážka dvě' })
      expect(blocks[2]).toEqual({ type: 'list_item', ordered: true, number: '1', indent: 0, content: 'První číslované' })
      expect(blocks[3]).toEqual({ type: 'list_item', ordered: true, number: '2', indent: 0, content: 'Druhé číslované' })
    })

    it('parses horizontal rules and paragraphs', () => {
      const md = 'Běžný odstavec.\n\n---\n\nDalší odstavec.'
      const blocks = parseMarkdownBlocks(md)
      expect(blocks.length).toBe(3)
      expect(blocks[0]).toEqual({ type: 'paragraph', content: 'Běžný odstavec.' })
      expect(blocks[1]).toEqual({ type: 'hr' })
      expect(blocks[2]).toEqual({ type: 'paragraph', content: 'Další odstavec.' })
    })
  })

  describe('tokenizeInlineMarkdown', () => {
    it('parses plain text without tokens', () => {
      const tokens = tokenizeInlineMarkdown('Obyčejný text')
      expect(tokens).toEqual([{ type: 'text', content: 'Obyčejný text' }])
    })

    it('parses links and post references', () => {
      const text = 'Uživatel [@EBBN](https://nyx.cz/discussion/123/id/456) napsal příspěvek.'
      const tokens = tokenizeInlineMarkdown(text)
      expect(tokens.length).toBe(3)
      expect(tokens[0]).toEqual({ type: 'text', content: 'Uživatel ' })
      expect(tokens[1]).toEqual({
        type: 'link',
        text: '@EBBN',
        url: 'https://nyx.cz/discussion/123/id/456',
      })
      expect(tokens[2]).toEqual({ type: 'text', content: ' napsal příspěvek.' })
    })

    it('parses bold, italic, and inline code', () => {
      const text = '**tučný** a *kurzíva* a `kód`'
      const tokens = tokenizeInlineMarkdown(text)
      expect(tokens[0]).toEqual({ type: 'bold', text: 'tučný' })
      expect(tokens[1]).toEqual({ type: 'text', content: ' a ' })
      expect(tokens[2]).toEqual({ type: 'italic', text: 'kurzíva' })
      expect(tokens[3]).toEqual({ type: 'text', content: ' a ' })
      expect(tokens[4]).toEqual({ type: 'code', text: 'kód' })
    })

    it('parses autolink URLs', () => {
      const text = 'Viz https://nyx.cz pro detaily'
      const tokens = tokenizeInlineMarkdown(text)
      expect(tokens[1]).toEqual({
        type: 'link',
        text: 'https://nyx.cz',
        url: 'https://nyx.cz',
      })
    })

    it('parses bold wrapped links and links with attached punctuation', () => {
      const boldLink = '**[@EBBN](https://nyx.cz/discussion/123/id/456)**'
      const t1 = tokenizeInlineMarkdown(boldLink)
      expect(t1).toEqual([
        {
          type: 'link',
          text: '@EBBN',
          url: 'https://nyx.cz/discussion/123/id/456',
          bold: true,
        },
      ])

      const boldLinkColon = '**[@EBBN](https://nyx.cz/discussion/123/id/456)**: text'
      const t2 = tokenizeInlineMarkdown(boldLinkColon)
      expect(t2[0]).toEqual({
        type: 'link',
        text: '@EBBN',
        url: 'https://nyx.cz/discussion/123/id/456',
        bold: true,
      })
      expect(t2[1]).toEqual({
        type: 'text',
        content: ': text',
      })

      const linkComma = 'Podle [@EBBN](https://nyx.cz/discussion/123/id/456), který napsal'
      const t3 = tokenizeInlineMarkdown(linkComma)
      expect(t3[1]).toEqual({
        type: 'link',
        text: '@EBBN',
        url: 'https://nyx.cz/discussion/123/id/456',
      })
      expect(t3[2]).toEqual({
        type: 'text',
        content: ', který napsal',
      })

      const linkPunctInUrl = 'Viz [@EBBN](https://nyx.cz/discussion/123/id/456.) a pokračování.'
      const t4 = tokenizeInlineMarkdown(linkPunctInUrl)
      expect(t4[1]).toEqual({
        type: 'link',
        text: '@EBBN',
        url: 'https://nyx.cz/discussion/123/id/456',
      })
      expect(t4[2]).toEqual({
        type: 'text',
        content: '. a pokračování.',
      })

      const parenLink = '([@EBBN](https://nyx.cz/discussion/123/id/456))'
      const t5 = tokenizeInlineMarkdown(parenLink)
      expect(t5[0]).toEqual({ type: 'text', content: '(' })
      expect(t5[1]).toEqual({
        type: 'link',
        text: '@EBBN',
        url: 'https://nyx.cz/discussion/123/id/456',
      })
      expect(t5[2]).toEqual({ type: 'text', content: ')' })
    })
  })
})
