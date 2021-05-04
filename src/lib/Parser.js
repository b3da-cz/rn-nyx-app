import Bugfender from '@bugfender/rn-bugfender'
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
    this.clearText = ''
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
    this.spoilers.forEach(s => (content = content.split(s.raw).join(`${T.SPLIT}${T.SPOILER}${s.id}${T.SPLIT}`)))
    this.replies.forEach(l => (content = content.split(l.raw).join(`${T.SPLIT}${T.REPLY}${l.id}${T.SPLIT}`)))
    this.links.forEach(l => (content = content.split(l.raw).join(`${T.SPLIT}${T.LINK}${l.id}${T.SPLIT}`)))
    this.images.forEach(i => (content = content.split(i.raw).join(`${T.SPLIT}${T.IMG}${i.id}${T.SPLIT}`)))
    this.codeBlocks.forEach(c => (content = content.split(c.raw).join(`${T.SPLIT}${T.CODE}${c.id}${T.SPLIT}`)))
    this.ytBlocks.forEach(y => (content = content.split(y.raw).join(`${T.SPLIT}${T.YT}${y.id}${T.SPLIT}`)))
    this.ytBlocksToDelete.forEach(y => (content = content.split(y.raw).join('')))
    this.pcBlocksToDelete.forEach(p => (content = content.split(p.raw).join('')))
    this.contentParts = content.split(T.SPLIT)
    this.finalizeText()
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
      url: a.getAttribute('href'),
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
      .filter(a => a.getAttribute('href') && (a.getAttribute('href').includes('youtube') || a.getAttribute('href').includes('youtu.be')))
      .map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        text: a.innerText,
        link: a.getAttribute('href'),
        videoId: a.getAttribute('href') && a.getAttribute('href').includes('youtube')
          ? a.getAttribute('href').replace('https://www.youtube.com/watch?v=', '').split('&')[0]
          : a.getAttribute('href') && a.getAttribute('href').includes('youtu.be') ? a.getAttribute('href').replace('https://youtu.be/', '') : 'error',
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
        p = p.trim()
        if (!p || (p && (p.length === 0 || p === ' '))) {
          this.contentParts.splice(i)
        } else {
          this.contentParts[i] = p
            .split('<br>')
            .join('\n')
            .split('<br />')
            .join('\n')
            .split('\n\n')
            .join('\n')
            .split('&lt;')
            .join('<')
            .split('&gt;')
            .join('>')
            .split('&amp;')
            .join('&')
            .replace(/(<([^>]+)>)/gi, '')
          this.clearText += this.contentParts[i]
        }
      } else if (p?.length > 3 && p.startsWith(TOKEN.REPLY)) {
        const link = this.replies.filter(l => l.id === p.replace(TOKEN.REPLY, ''))[0]
        this.clearText += `[${link.text}](${link.url.startsWith('/discussion/') ? 'https://nyx.cz' : ''}${link.url})`
      } else if (p?.length > 3 && p.startsWith(TOKEN.LINK)) {
        const link = this.links.filter(l => l.id === p.replace(TOKEN.LINK, ''))[0]
        this.clearText += `[${link.text}](${link.url.startsWith('/discussion/') ? 'https://nyx.cz' : ''}${link.url})`
      } else if (p?.length > 3 && p.startsWith(TOKEN.IMG)) {
        const img = this.images.filter(l => l.id === p.replace(TOKEN.IMG, ''))[0]
        this.clearText += `${img.src.startsWith('/files/') ? 'https://nyx.cz' : ''}${img.url}`
      }
    })
  }
}

export const parsePostsContent = posts => {
  try {
    for (const post of posts) {
      if (!post.parsed) {
        const parser = new Parser(post.content)
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
