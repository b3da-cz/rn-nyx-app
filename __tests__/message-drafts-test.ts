import {
  applyMailRecipientChange,
  clubDraftKey,
  emptyMessageDrafts,
  flushMessageDrafts,
  mailDraftKey,
  normalizeMessageDrafts,
  readDraft,
  readMessageDraft,
  rememberDraft,
  resetMessageDraftMemory,
  switchMailDraft,
  writeDraft,
} from '../src/lib/messageDrafts'

jest.mock('../src/lib/Storage', () => ({
  Storage: {
    getMessageDrafts: jest.fn(async () => null),
    setMessageDrafts: jest.fn(async () => undefined),
  },
}))

describe('message draft keys', () => {
  it('keeps a club id and a mail username apart', () => {
    expect(clubDraftKey(12)).toBe('12')
    expect(clubDraftKey('8')).toBe('8')
    expect(clubDraftKey(0)).toBe('')
    expect(clubDraftKey(null)).toBe('')
    expect(mailDraftKey(' pepa ')).toBe('PEPA')
    expect(mailDraftKey('')).toBe('')
  })

  it('drops a blank draft and keeps the other one', () => {
    const club = writeDraft({}, '4', 'text do klubu')
    const mail = writeDraft({}, 'PEPA', 'soukromě')
    expect(readDraft(writeDraft(club, '4', '   '), '4')).toBe('')
    expect(readDraft(mail, 'PEPA')).toBe('soukromě')
    expect(normalizeMessageDrafts({ club: { '4': '  ' }, mail: { PEPA: 'a' }, extra: 1 })).toEqual({
      club: {},
      mail: { PEPA: 'a' },
    })
  })
})

describe('mail recipient change', () => {
  const stored = { PEPA: 'rozepsáno Pepovi', KAREL: 'Karlovi' }

  it('shows the saved text when the username is chosen and the field is empty', () => {
    const applied = applyMailRecipientChange({
      drafts: stored,
      previousUsername: '',
      nextUsername: 'pepa',
      currentText: '',
    })
    expect(applied.text).toBe('rozepsáno Pepovi')
    expect(applied.drafts.PEPA).toBe('rozepsáno Pepovi')
    expect(applied.drafts.KAREL).toBe('Karlovi')
  })

  it('stores the previous username before opening the next draft', () => {
    const applied = applyMailRecipientChange({
      drafts: stored,
      previousUsername: 'PEPA',
      nextUsername: 'karel',
      currentText: 'ještě něco',
    })
    expect(applied.drafts.PEPA).toBe('ještě něco')
    expect(applied.text).toBe('Karlovi')
  })

  it('keeps text typed before any username is chosen', () => {
    const applied = applyMailRecipientChange({
      drafts: stored,
      previousUsername: undefined,
      nextUsername: 'PEPA',
      currentText: 'nový text',
    })
    expect(applied.text).toBe('nový text')
    expect(applied.drafts.PEPA).toBe('nový text')
  })

  it('removes a draft that was cleared', () => {
    const applied = applyMailRecipientChange({
      drafts: stored,
      previousUsername: 'PEPA',
      nextUsername: '',
      currentText: ' ',
    })
    expect(applied.text).toBe('')
    expect(applied.drafts.PEPA).toBeUndefined()
  })
})

describe('message draft memory', () => {
  const { Storage } = require('../src/lib/Storage')

  beforeEach(() => {
    resetMessageDraftMemory()
    Storage.setMessageDrafts.mockClear()
  })

  it('remembers a club draft and a mail draft in one store', async () => {
    rememberDraft('club', clubDraftKey(15), 'v klubu')
    const text = switchMailDraft(undefined, 'fuxo', '')
    expect(text).toBe('')
    switchMailDraft('fuxo', 'fuxo', 'mail text')
    rememberDraft('mail', 'FUXO', 'mail text')
    await flushMessageDrafts()
    expect(Storage.setMessageDrafts).toHaveBeenCalledWith({
      club: { '15': 'v klubu' },
      mail: { FUXO: 'mail text' },
    })
    expect(readMessageDraft('club', '15')).toBe('v klubu')
    expect(emptyMessageDrafts()).toEqual({ club: {}, mail: {} })
  })
})
