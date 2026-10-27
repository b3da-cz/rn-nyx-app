import { parse } from 'node-html-parser'
import { plainDiscussionText } from './discussionRequest'

// Poll question, instructions, and answers are HTML fragments. The post body
// stays empty (Parser skips type poll) and PollComponent draws these fragments.
// Images are copied onto parsed.images so the usual measure / placeholder /
// gallery path can size them. Their height is not added again inside the poll
// chrome; computeImagesHeight already reserves it.

const absUrl = (url?: string | null) => {
  if (!url) {
    return ''
  }
  if (url.startsWith('//')) {
    return `https:${url}`
  }
  return url.startsWith('/') ? `https://nyx.cz${url}` : url
}

const withBreaks = (value: unknown) => String(value ?? '').replace(/<\/(p|div|li|h[1-6])>/gi, '\n')

export const pollPlainText = (value: unknown) => plainDiscussionText(withBreaks(value))

export const pollHtmlSource = (value: unknown) => withBreaks(value)

export type PollAnswer = {
  key: string
  answer: string
  result?: { respondents_count?: number; is_my_vote?: boolean }
}

export const pollAnswers = (answers: any): PollAnswer[] => {
  if (!answers) {
    return []
  }
  if (Array.isArray(answers)) {
    return answers.map((item, index) => ({
      key: String(item?.id ?? index),
      answer: String(item?.answer ?? ''),
      result: item?.result,
    }))
  }
  return Object.keys(answers).map(key => ({
    key,
    answer: String(answers[key]?.answer ?? ''),
    result: answers[key]?.result,
  }))
}

export const pollHtmlImages = (html?: unknown) => {
  const source = String(html ?? '')
  if (!source.includes('<')) {
    return []
  }
  try {
    return parse(`<div>${source}</div>`)
      .querySelectorAll('img')
      .flatMap(img => {
        const src = absUrl(img.getAttribute('src'))
        if (!src || src.includes('/images/play')) {
          return []
        }
        const thumb = absUrl(img.getAttribute('data-thumb'))
        return [{ src, ...(thumb ? { thumb } : null) }]
      })
  } catch (e) {
    return []
  }
}

export const attachPollMedia = (post: any) => {
  const type = post?.content_raw?.type || post?.post_type
  if (type !== 'poll' || !post) {
    return post
  }
  if (!post.parsed) {
    post.parsed = {}
  }
  if (post.parsed.clearText == null) {
    post.parsed.clearText = ''
  }
  const data = post.content_raw?.data || {}
  const answers = pollAnswers(data.answers)
  const plainAnswers = answers.map(answer => pollPlainText(answer.answer))
  post.parsed.pollPlain = {
    question: pollPlainText(data.question),
    instructions: pollPlainText(data.instructions),
    answers: plainAnswers,
  }
  if (!post.parsed.images?.length) {
    const images = [data.question, data.instructions, ...answers.map(answer => answer.answer)].flatMap(pollHtmlImages)
    post.parsed.images = images.map((img, index) => ({
      ...img,
      id: `poll-${post.id ?? 'x'}-${index}`,
    }))
  }
  return post
}

export type PollLayoutModel = {
  question: string
  instructions: string
  answers: string[]
  canVote: boolean
  showVoteButton: boolean
  showStats: boolean
  voteRows: number
  resultRows: number
}

// Nyx stores the deadline with nanosecond precision and no timezone.
// Date.parse only accepts millisecond fractions.
export const pollDeadline = (value: unknown): number | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }
  const time = Date.parse(value.trim().replace(/(\.\d{3})\d+/, '$1'))
  return Number.isNaN(time) ? null : time
}

export const pollIsClosed = (data: any, now = Date.now()) => {
  const until = pollDeadline(data?.allow_answers_until ?? data?.allowed_answers_until)
  return until != null && until <= now
}

export const pollLayoutModel = (post: any, now = Date.now()): PollLayoutModel => {
  const data = post?.content_raw?.data || {}
  const answers = pollAnswers(data.answers)
  const plain = post?.parsed?.pollPlain
  const totals = data.computed_values || {}
  const voted = !!totals.user_did_vote
  const closed = pollIsClosed(data, now)
  return {
    question: plain?.question ?? pollPlainText(data.question),
    instructions: plain?.instructions ?? pollPlainText(data.instructions),
    answers: plain?.answers ?? answers.map(answer => pollPlainText(answer.answer)),
    canVote: !voted && !closed,
    showVoteButton: !voted,
    showStats: (totals.total_votes || 0) > 0 || (totals.total_respondents || 0) > 0,
    voteRows: Array.isArray(data.votes) ? data.votes.length : 0,
    resultRows: answers.filter(answer => answer.result).length,
  }
}

// Text heights are measured separately. Image height is not included here.
export const pollContentHeight = ({
  questionHeight = 0,
  instructionsHeight = 0,
  answerHeights = [],
  statsHeight = 0,
  canVote = false,
  voteRows = 0,
  resultRows = 0,
  fontScale = 1,
}: {
  questionHeight?: number
  instructionsHeight?: number
  answerHeights?: number[]
  statsHeight?: number
  canVote?: boolean
  voteRows?: number
  resultRows?: number
  fontScale?: number
}) => {
  const scale = fontScale || 1
  const answers = answerHeights.reduce((sum, height) => {
    const text = height > 0 ? height : 0
    // Image-only answers still need a border and the gap under the picture.
    // The picture itself is reserved with the post images.
    return sum + (text > 0 ? Math.max(52 * scale, text + 16 * scale) : 16 * scale)
  }, 0)
  return (
    (questionHeight || 0) +
    36 * scale +
    (instructionsHeight || 0) +
    (statsHeight || 0) +
    answers +
    resultRows * 8 * scale +
    (canVote ? 72 * scale : 8 * scale) +
    voteRows * 44 * scale
  )
}

// Mirrors PostComponent: text tokens stay in one Text, images and video break out.
const TEXT_TOKEN = /^###(S|TB|TI|R|L|C)#/

export const isPollTextPart = (part: string) => {
  if (!part) {
    return false
  }
  if (!part.startsWith('###')) {
    return true
  }
  return TEXT_TOKEN.test(part)
}

export const pollContentBlocks = (parts: string[] = []) => {
  const blocks: { isText: boolean; parts: string[] }[] = []
  let current: { isText: boolean; parts: string[] } | null = null
  for (const part of parts) {
    if (!part) {
      continue
    }
    const isText = isPollTextPart(part)
    if (!current || current.isText !== isText) {
      current = { isText, parts: [] }
      blocks.push(current)
    }
    current.parts.push(part)
  }
  return blocks
}
