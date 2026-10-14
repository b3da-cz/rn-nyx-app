import { PixelRatio } from 'react-native'
import rnTextSize from 'react-native-text-size'
import { getBlockSizes } from '../src/lib/LayoutHelper'

jest.mock('react-native-text-size', () => ({
  flatHeights: jest.fn(async ({ text, fontSize }) => text.map((t: string) => (t ? t.length * (fontSize || 15) : 0))),
}))

describe('LayoutHelper getBlockSizes', () => {
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
})
