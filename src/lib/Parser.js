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
  constructor(htmlString) {
    this.contentRaw = htmlString
    this.contentTemplate = null
    this.contentParts = []
    this.isParsed = false
    this.isTokenized = false
    this.html = parse(`<div>${htmlString}</div>`)
    this.TOKEN = TOKEN
  }

  parse() {
    if (!this.isParsed) {
      this.getBlocksFromHtml()
    }
    if (!this.isTokenized) {
      this.tokenizeContent()
    }
    return {
      contentParts: this.contentParts,
      spoilers: this.spoilers,
      replies: this.replies,
      links: this.links,
      images: this.images,
      codeBlocks: this.codeBlocks,
      ytBlocks: this.ytBlocks,
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
    this.isParsed = true
  }

  tokenizeContent() {
    const T = this.TOKEN
    let content = this.contentRaw
    this.spoilers.forEach(s => (content = content.split(s.raw).join(`${T.SPLIT}${T.SPOILER}${s.id}${T.SPLIT}`)))
    this.replies.forEach(l => (content = content.split(l.raw).join(`${T.SPLIT}${T.REPLY}${l.id}${T.SPLIT}`)))
    this.links.forEach(l => (content = content.split(l.raw).join(`${T.SPLIT}${T.LINK}${l.id}${T.SPLIT}`)))
    this.images.forEach(i => (content = content.split(i.raw).join(`${T.SPLIT}${T.IMG}${i.id}${T.SPLIT}`)))
    this.codeBlocks.forEach(c => (content = content.split(c.raw).join(`${T.SPLIT}${T.CODE}${c.id}${T.SPLIT}`)))
    this.ytBlocks.forEach(y => (content = content.split(y.raw).join(`${T.SPLIT}${T.YT}${y.id}${T.SPLIT}`)))
    this.ytBlocksToDelete.forEach(y => (content = content.split(y.raw).join('')))
    this.contentParts = content.split(T.SPLIT)
    this.contentTemplate = content
    this.isTokenized = true
  }

  getSpoilers() {
    return this.html.querySelectorAll('.spoiler').map(s => ({
      id: generateUuidV4(),
      raw: s.toString(),
      text: s.innerText,
    }))
  }

  getReplies() {
    return this.html.querySelectorAll('a[data-discussion-id]').map(a => ({
      id: generateUuidV4(),
      raw: a.toString(),
      text: a.innerText,
      discussionId: a.getAttribute('data-discussion-id'),
      postId: a.getAttribute('data-id'),
    }))
  }

  getLinks() {
    return this.html
      .querySelectorAll('a')
      .filter(
        a =>
          !a.hasAttribute('data-discussion-id') &&
          !a.getAttribute('href').includes('youtube') &&
          !a.getAttribute('href').includes('youtu.be'),
      )
      .map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        text: a.innerText,
        url: a.getAttribute('href'),
      }))
  }

  getImages() {
    return this.html.querySelectorAll('img').map(i => ({
      id: generateUuidV4(),
      raw: i.toString(),
      src: i.getAttribute('src'),
      thumb: i.getAttribute('data-thumb'),
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
      .filter(a => a.getAttribute('href').includes('youtube') || a.getAttribute('href').includes('youtu.be'))
      .map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        text: a.innerText,
        link: a.getAttribute('href'),
        videoId: a.getAttribute('href').includes('youtube')
          ? a.getAttribute('href').replace('https://www.youtube.com/watch?v=', '').split('&')[0]
          : a.getAttribute('href').replace('https://youtu.be/', ''),
      }))
  }

  getYtBlocksForCleanup() {
    return this.html.querySelectorAll('div.embed-wrapper').map(a => ({
      id: generateUuidV4(),
      raw: a.toString(),
      videoId: a.getAttribute('data-embeded-type'),
    }))
  }
}
