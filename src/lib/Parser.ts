import Bugfender from '@bugfender/rn-bugfender'
import he from 'he'
import { parse } from 'node-html-parser'
import { fetchImageSizes, generateUuidV4, getBlockSizes, getDistinctPosts } from '../lib'

export const TOKEN = {
  // meh todo
  SPLIT: '//######//',
  SPOILER: '###S#',
  REPLY: '###R#',
  LINK: '###L#',
  IMG: '###I#',
  CODE: '###C#',
  YT: '###Y#',
  VIDEO: '###V#',
}

export class Parser {
  contentRaw: string
  contentTemplate: string
  contentParts: string[]
  clearText: string
  clearTextWithUrls: string
  type: string
  isParsed: boolean
  isTokenized: boolean
  html: HTMLElement | any
  advertisement: any
  spoilers: any[] = []
  replies: any[] = []
  links: any[] = []
  images: any[] = []
  codeBlocks: any[] = []
  ytBlocks: any[] = []
  videos: any[] = []
  ytBlocksToDelete: any[] = []
  pcBlocksToDelete: any[] = []
  constructor(htmlString: string, postType = 'text') {
    // undefined type === users own text posts
    this.contentRaw = htmlString
    this.contentTemplate = ''
    this.contentParts = []
    this.clearText = ''
    this.clearTextWithUrls = ''
    this.type = postType
    this.isParsed = false
    this.isTokenized = false
    this.html = parse(`<div>${htmlString}</div>`)
  }

  parse() {
    if (this.type === 'dice' || this.type === 'poll') {
      return {}
    }
    if (this.type === 'advertisement') {
      this.parseAdvertisement()
    }
    if (!this.isParsed) {
      this.getBlocksFromHtml()
    }
    if (!this.isTokenized) {
      this.tokenizeContent()
    }
    return {
      advertisement: this.advertisement,
      contentParts: this.contentParts,
      spoilers: this.spoilers,
      replies: this.replies,
      links: this.links,
      images: this.images.filter(img => !img.src.includes('/images/play')),
      codeBlocks: this.codeBlocks,
      ytBlocks: this.ytBlocks,
      videos: this.videos,
      clearText: this.clearText,
      clearTextWithUrls: this.clearTextWithUrls,
      height: null,
      offset: null,
    }
  }

  getBlocksFromHtml() {
    this.spoilers = this.getSpoilers()
    this.replies = this.getReplies()
    this.links = this.getLinks()
    this.images = this.getImages()
    this.codeBlocks = this.getCodeBlocks()
    this.ytBlocks = this.getVideosYoutube()
    this.videos = this.getVideoTags() || []
    this.ytBlocksToDelete = this.getYtBlocksForCleanup()
    this.pcBlocksToDelete = this.getPCBlocksForCleanup()
    this.isParsed = true
  }

  tokenizeContent() {
    const T = TOKEN
    let content = this.contentRaw
    this.spoilers.forEach(s => (content = content.replace(s.raw, `${T.SPLIT}${T.SPOILER}${s.id}${T.SPLIT}`)))
    this.replies.forEach(l => (content = content.replace(l.raw, `${T.SPLIT}${T.REPLY}${l.id}${T.SPLIT}`)))
    this.images.forEach(i => (content = content.replace(i.raw, `${T.SPLIT}${T.IMG}${i.id}${T.SPLIT}`)))
    this.links.forEach(l => (content = content.replace(l.raw, `${T.SPLIT}${T.LINK}${l.id}${T.SPLIT}`)))
    this.codeBlocks.forEach(c => (content = content.replace(c.raw, `${T.SPLIT}${T.CODE}${c.id}${T.SPLIT}`)))
    this.ytBlocks.forEach(y => (content = content.replace(y.raw, `${T.SPLIT}${T.YT}${y.id}${T.SPLIT}`)))
    this.videos.forEach(v => (content = content.replace(v.raw, `${T.SPLIT}${T.VIDEO}${v.id}${T.SPLIT}`)))
    this.ytBlocksToDelete.forEach(y => (content = content.replace(y.raw, '')))
    this.pcBlocksToDelete.forEach(p => (content = content.replace(p.raw, '')))
    this.contentParts = content.split(T.SPLIT)
    this.finalizeText()
    this.contentTemplate = content
    this.isTokenized = true
  }

  getSpoilers() {
    return this.html.querySelectorAll('.spoiler').map(s => ({
      id: generateUuidV4(),
      raw: s.toString(),
      text: this.replaceHtmlEntitiesAndTags(s.innerText || ''),
    }))
  }

  getReplies() {
    return [
      ...this.html.querySelectorAll('a[data-discussion-id]').map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        text: this.replaceHtmlEntitiesAndTags(a.innerText || ''),
        discussionId: a.getAttribute('data-discussion-id'),
        postId: a.getAttribute('data-id'),
        url: this.fixLink(a.getAttribute('href')),
      })),
      ...this.html
        .querySelectorAll('a')
        .filter(
          a =>
            !a.hasAttribute('data-discussion-id') &&
            a.getAttribute('href') &&
            a.getAttribute('href').startsWith('/discussion'),
        )
        .map(a => ({
          id: generateUuidV4(),
          raw: a.toString(),
          text: this.replaceHtmlEntitiesAndTags(a.innerText || ''),
          discussionId: a.getAttribute('href').split('/')[2],
          postId: a.getAttribute('href').split('/')[4],
          url: this.fixLink(a.getAttribute('href')),
        })),
    ]
  }

  getLinks() {
    return this.html
      .querySelectorAll('a')
      .filter(
        a =>
          !a.hasAttribute('data-discussion-id') &&
          a.getAttribute('href') &&
          !a.getAttribute('href').includes('youtube') &&
          !a.getAttribute('href').includes('youtu.be') &&
          !a.getAttribute('href').startsWith('/discussion'),
      )
      .map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        text: this.replaceHtmlEntitiesAndTags(a.innerText || ''),
        url: this.fixLink(a.getAttribute('href')),
      }))
  }

  getImages() {
    return this.html
      .querySelectorAll('img')
      .filter(i => i.hasAttribute('src'))
      .map(i => ({
        id: generateUuidV4(),
        raw: i.toString(),
        src: this.fixLink(i.getAttribute('src')),
        thumb: this.fixLink(i.getAttribute('data-thumb')),
      }))
  }

  getCodeBlocks() {
    return this.html.querySelectorAll('pre').map(p => ({
      id: generateUuidV4(),
      raw: p.toString(),
    }))
  }

  getVideosYoutube() {
    const ytBlocks = this.html
      .querySelectorAll('a')
      .filter(
        a =>
          a.getAttribute('href') &&
          (a.getAttribute('href').includes('youtube') || a.getAttribute('href').includes('youtu.be')),
      )
      .map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        text: this.replaceHtmlEntitiesAndTags(a.innerText || ''),
        link: a.getAttribute('href'),
        videoId:
          a.getAttribute('href') && a.getAttribute('href').includes('youtube')
            ? a.getAttribute('href').replace('https://www.youtube.com/watch?v=', '').split('&')[0]
            : a.getAttribute('href') && a.getAttribute('href').includes('youtu.be')
            ? a.getAttribute('href').replace('https://youtu.be/', '')
            : 'error',
      }))
    return ytBlocks.map(b => {
      let videoId = b.videoId
      if (b.videoId.split('?').length > 1) {
        videoId = b.videoId.split('?')[0]
      }
      return { ...b, videoId }
    })
  }

  getVideoTags() {
    // todo prefetch height.. possible?
    return this.html.querySelectorAll('video').map(v => ({
      id: generateUuidV4(),
      raw: v.toString(),
      link: v.getAttribute('src') ?? v.querySelector('source')?.getAttribute('src'),
    }))
  }

  getYtBlocksForCleanup() {
    return this.html.querySelectorAll('div.embed-wrapper').map(a => ({
      id: generateUuidV4(),
      raw: a.toString(),
      videoId: a.getAttribute('data-embeded-type'),
    }))
  }

  getPCBlocksForCleanup() {
    // pc, pc-poll, pc-dice
    return this.html.querySelectorAll('div.pc').map(a => ({
      id: generateUuidV4(),
      raw: a.toString(),
    }))
  }

  parseAdvertisement() {
    this.advertisement = {
      action: this.html.querySelector('h3').innerText,
      title: this.replaceHtmlEntitiesAndTags(this.html.querySelector('h2').innerText),
      location: this.replaceHtmlEntitiesAndTags(this.html.querySelector('div.location').innerText),
      price: this.replaceHtmlEntitiesAndTags(this.html.querySelector('div.price').innerText),
      updated: this.html.querySelector('div.updated').innerText,
    }
  }

  finalizeText() {
    this.clearText = ''
    this.clearTextWithUrls = ''
    this.contentParts.forEach((p, i) => {
      if (p?.length > 3 && !p.startsWith('###')) {
        p = this.replaceHtmlEntitiesAndTags(p)
        if (!p || (p && p.length === 0)) {
          this.contentParts.splice(i, 1)
        } else {
          this.contentParts[i] = p
          this.clearText += this.contentParts[i]
          this.clearTextWithUrls += this.contentParts[i]
        }
      } else if (p?.length > 3 && p.startsWith(TOKEN.REPLY)) {
        const link = this.replies.filter(l => l.id === p.replace(TOKEN.REPLY, ''))[0]
        this.clearText += `${link.text} `
        this.clearTextWithUrls += `[${link.text}](${link.url})`
      } else if (p?.length > 3 && p.startsWith(TOKEN.LINK)) {
        const link = this.links.filter(l => l.id === p.replace(TOKEN.LINK, ''))[0]
        this.clearText += `${link.text} `
        this.clearTextWithUrls += `[${link.text}](${link.url})`
      } else if (p?.length > 3 && p.startsWith(TOKEN.IMG)) {
        const img = this.images.filter(l => l.id === p.replace(TOKEN.IMG, ''))[0]
        this.clearTextWithUrls += `${img.src}`
      } else if (p?.length > 3 && p.startsWith(TOKEN.YT)) {
        const vid = this.ytBlocks.filter(l => l.id === p.replace(TOKEN.YT, ''))[0]
        this.clearText += `[${vid.text}] `
        this.clearTextWithUrls += `[${vid.text}]`
      }
    })
  }

  replaceHtmlEntitiesAndTags(text) {
    text = he.decode(text)
    return text
      .trim()
      .split('<br>')
      .join('\n')
      .split('<br />')
      .join('\n')
      .replace(/(<([^>]+)>)/gi, '')
  }

  fixLink(url) {
    return url?.startsWith('/') ? `https://nyx.cz${url}` : url
  }
}

export const parsePostsContent = posts => {
  try {
    for (const post of posts) {
      if (!post.parsed) {
        const parser = new Parser(post.content, post.post_type)
        post.parsed = parser.parse()
      }
    }
  } catch (e) {
    Bugfender.e('ERROR_PARSER', e.stack)
  }
  return posts
}

export const parseNotificationsContent = notifications => {
  try {
    for (const notification of notifications) {
      notification.data = parsePostsContent([notification.data])[0]
      if (notification?.details?.replies?.length) {
        notification.details.replies = parsePostsContent(notification.details.replies)
      }
    }
  } catch (e) {
    Bugfender.e('ERROR_PARSER', e.stack)
  }
  return notifications
}

export const recountDiscussionList = discussions => {
  try {
    return discussions.map(d => {
      const unreadPostCount = Math.max(
        d.new_posts_count || 0,
        d.new_replies_count || 0,
        d.new_images_count || 0,
        d.new_links_count || 0,
      ) // new_posts_count is weird sometimes
      return { ...d, unreadPostCount }
    })
  } catch (e) {
    Bugfender.e('ERROR_PARSER', e.stack)
  }
  return discussions
}

export const preparePosts = async (newPosts: any[], oldPosts: any[] = [], calculateSizes = false, themeBaseFontSize?) => {
  const distinctPosts = getDistinctPosts(newPosts, oldPosts)
  const parsedPosts = parsePostsContent(distinctPosts)
  if (calculateSizes) {
    const parsedPostsWImageSizes = await fetchImageSizes(parsedPosts, false)
    return await getBlockSizes(parsedPostsWImageSizes, themeBaseFontSize)
  }
  return parsedPosts
}
