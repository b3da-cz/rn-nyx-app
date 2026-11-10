import { PixelRatio } from 'react-native'
import rnTextSize from 'react-native-text-size'
import { applyImageDownloadPolicy, assignPostOffsets, getBlockSizes, postsNeedingLayout } from '../src/lib/LayoutHelper'

jest.mock('react-native-text-size', () => ({
  flatHeights: jest.fn(async ({ text, fontSize }) => text.map((t: string) => (t ? t.length * (fontSize || 15) : 0))),
}))

describe('LayoutHelper getBlockSizes', () => {
  it('keeps posts that already have a height out of the next layout pass', () => {
    const posts = [{ id: 1, parsed: { height: 80 } }, { id: 2, parsed: { height: null } }, { id: 3 }]
    expect(postsNeedingLayout(posts).map(post => post.id)).toEqual([2, 3])
  })

  it('does not emit bytes progress or overwrite cached byteLength in applyImageDownloadPolicy', async () => {
    const events: any[] = []
    const posts = [
      {
        id: 1,
        parsed: {
          images: [
            {
              src: 'https://nyx.cz/files/cached-size.jpg',
              width: 3,
              height: 2,
              byteLength: 450000,
              skipDownload: true,
            },
          ],
        },
      },
    ]
    await applyImageDownloadPolicy(posts, 200, event => events.push(event))
    expect(events.filter(e => e.id === 'bytes')).toEqual([])
    expect(events.filter(e => e.id === 'sizes')).toEqual([])
    expect(posts[0].parsed.images[0].byteLength).toBe(450000)
    expect(posts[0].parsed.images[0].skipDownload).toBe(true)
  })

  it('recomputes offsets from existing heights', () => {
    const posts = [
      { parsed: { height: 120 } },
      { parsed: { height: 80 } },
      { parsed: {} },
    ]
    assignPostOffsets(posts)
    expect(posts.map(post => post.parsed.offset)).toEqual([120, 200, 200])
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calculates post height and offsets with default fontScale', async () => {
    const posts = [
      {
        id: 1,
        parsed: {
          clearText: 'Hello world',
          images: [],
        },
      },
      {
        id: 2,
        parsed: {
          clearText: 'Second post with more text',
          images: [],
        },
      },
    ]

    const result = await getBlockSizes(posts, 15, 1.0)
    expect(result[0].parsed.height).toBeGreaterThan(75)
    expect(result[0].parsed.offset).toBe(result[0].parsed.height)
    expect(result[1].parsed.offset).toBe(result[0].parsed.height + result[1].parsed.height)

    expect(rnTextSize.flatHeights).toHaveBeenCalledWith(
      expect.objectContaining({
        allowFontScaling: true,
        fontSize: expect.any(Number),
      }),
    )
  })

  it('scales post heights when fontScale increases', async () => {
    const makePosts = () => [
      {
        id: 1,
        parsed: {
          clearText: 'Same content',
          images: [],
        },
      },
    ]

    const normal = await getBlockSizes(makePosts(), 15, 1.0)
    const scaled = await getBlockSizes(makePosts(), 15, 1.3)

    expect(scaled[0].parsed.height).toBeGreaterThan(normal[0].parsed.height)
  })

  it('scales minPostHeight according to fontScale for empty posts', async () => {
    const emptyPost = [
      {
        id: 1,
        parsed: {
          clearText: '',
          images: [],
        },
      },
    ]

    const normal = await getBlockSizes(emptyPost, 15, 1.0)
    expect(normal[0].parsed.height).toBe(75)

    const scaledEmptyPost = [
      {
        id: 1,
        parsed: {
          clearText: '',
          images: [],
        },
      },
    ]
    const scaled = await getBlockSizes(scaledEmptyPost, 15, 1.5)
    expect(scaled[0].parsed.height).toBe(Math.round(75 * 1.5))
  })

  it('reserves poll image height and wrapping answers instead of the raw html tag', async () => {
    const poll = (instructions: string, answer: string, image?: { width: number; height: number }) => ({
      id: 1,
      content_raw: {
        type: 'poll',
        data: {
          question: 'Jak je to správně?',
          instructions,
          answers: { '1': { answer: 'Vlevo' }, '2': { answer } },
          computed_values: { user_did_vote: false, total_votes: 0, total_respondents: 0 },
        },
      },
      parsed: {
        clearText: '',
        images: image
          ? [
              {
                id: 'poll-1-0',
                src: 'https://nyx.cz/files/a.jpg',
                width: image.width,
                height: image.height,
              },
            ]
          : [],
      },
    })
    const tag =
      '<img src="https://nyx.cz/files/a.jpg?name=IMG-20261027-WA0000.jpg">'
    const plain = await getBlockSizes([poll('', 'Vpravo')], 15, 1)
    const pictured = await getBlockSizes([poll(tag, 'Vpravo', { width: 300, height: 300 })], 15, 1)
    const wrapped = await getBlockSizes([poll('', 'Vpravo '.repeat(80))], 15, 1)
    expect(pictured[0].parsed.pollPlain.instructions).toBe('')
    expect(pictured[0].parsed.height).toBeGreaterThan(plain[0].parsed.height + 100)
    expect(wrapped[0].parsed.height).toBeGreaterThan(plain[0].parsed.height + 100)
  })
})
