import Bugfender from '@bugfender/rn-bugfender'
import he from 'he'
import { parse } from 'node-html-parser'
import { generateUuidV4 } from '../lib'

export const TOKEN = {
  // meh todo
  SPLIT: '//######//',
  SPOILER: '###S#',
  REPLY: '###R#',
  LINK: '###L#',
  IMG: '###I#',
  CODE: '###C#',
  YT: '###Y#',
}

export class Parser {
  constructor(htmlString, postType = 'text') {
    // undefined type === users own text posts
    this.contentRaw = htmlString
    this.contentTemplate = null
    this.contentParts = []
    this.clearText = ''
    this.type = postType
    this.isParsed = false
    this.isTokenized = false
    this.html = parse(`<div>${htmlString}</div>`)
    this.TOKEN = TOKEN
  }

  parse() {
    // todo get img dimensions and calc layout
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
      images: this.images,
      codeBlocks: this.codeBlocks,
      ytBlocks: this.ytBlocks,
      clearText: this.clearText,
    }
  }

  getBlocksFromHtml() {
    this.spoilers = this.getSpoilers()
    this.replies = this.getReplies()
    this.links = this.getLinks()
    this.images = this.getImages()
    this.codeBlocks = this.getCodeBlocks()
    this.ytBlocks = this.getVideosYoutube()
    this.ytBlocksToDelete = this.getYtBlocksForCleanup()
    this.pcBlocksToDelete = this.getPCBlocksForCleanup()
    this.isParsed = true
  }

  tokenizeContent() {
    const T = this.TOKEN
    let content = this.contentRaw
    this.spoilers.forEach(s => (content = content.replace(s.raw, `${T.SPLIT}${T.SPOILER}${s.id}${T.SPLIT}`)))
    this.replies.forEach(l => (content = content.replace(l.raw, `${T.SPLIT}${T.REPLY}${l.id}${T.SPLIT}`)))
    this.links.forEach(l => (content = content.replace(l.raw, `${T.SPLIT}${T.LINK}${l.id}${T.SPLIT}`)))
    this.images.forEach(i => (content = content.replace(i.raw, `${T.SPLIT}${T.IMG}${i.id}${T.SPLIT}`)))
    this.codeBlocks.forEach(c => (content = content.replace(c.raw, `${T.SPLIT}${T.CODE}${c.id}${T.SPLIT}`)))
    this.ytBlocks.forEach(y => (content = content.replace(y.raw, `${T.SPLIT}${T.YT}${y.id}${T.SPLIT}`)))
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
    return this.html.querySelectorAll('a[data-discussion-id]').map(a => ({
      id: generateUuidV4(),
      raw: a.toString(),
      text: this.replaceHtmlEntitiesAndTags(a.innerText || ''),
      discussionId: a.getAttribute('data-discussion-id'),
      postId: a.getAttribute('data-id'),
      url: this.fixLink(a.getAttribute('href')),
    }))
  }

  getLinks() {
    return this.html
      .querySelectorAll('a')
      .filter(
        a =>
          !a.hasAttribute('data-discussion-id') &&
          a.getAttribute('href') &&
          !a.getAttribute('href').includes('youtube') &&
          !a.getAttribute('href').includes('youtu.be'),
      )
      .map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        text: this.replaceHtmlEntitiesAndTags(a.innerText || ''),
        url: this.fixLink(a.getAttribute('href')),
      }))
  }

  getImages() {
    return this.html.querySelectorAll('img').map(i => ({
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
    return this.html
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
    // console.warn(this.html.firstChild.structure, this.advertisement) // TODO: remove
  }

  finalizeText() {
    this.clearText = ''
    this.contentParts.forEach((p, i) => {
      if (p?.length > 3 && !p.startsWith('###')) {
        if (p.startsWith(':')) {
          p = p.substring(1)
        }
        if (p.startsWith('<br>')) {
          p = p.substring(4)
        }
        p = this.replaceHtmlEntitiesAndTags(p)
        // const withoutWhitespaces = p.replace(/\s+/g, '')
        if (!p || (p && (p.length === 0 || p === ' ' || p === '\n'))) {
          this.contentParts.splice(i, 1)
        } else {
          this.contentParts[i] = p
          this.clearText += this.contentParts[i]
        }
      } else if (p?.length > 3 && p.startsWith(TOKEN.REPLY)) {
        const link = this.replies.filter(l => l.id === p.replace(TOKEN.REPLY, ''))[0]
        this.clearText += `[${link.text}](${link.url})`
      } else if (p?.length > 3 && p.startsWith(TOKEN.LINK)) {
        const link = this.links.filter(l => l.id === p.replace(TOKEN.LINK, ''))[0]
        this.clearText += `[${link.text}](${link.url})`
      } else if (p?.length > 3 && p.startsWith(TOKEN.IMG)) {
        const img = this.images.filter(l => l.id === p.replace(TOKEN.IMG, ''))[0]
        this.clearText += `${img.src}`
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
      .split('\n\n')
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
