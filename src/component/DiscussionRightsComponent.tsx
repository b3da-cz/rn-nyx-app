import React, { useContext, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dialog, FAB, Portal, Text, TextInput, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { DoubleTapDeleteButton } from './DoubleTapDeleteButton'
import { androidStackBottomInset } from './FabComponent'
import { LoaderComponent } from './LoaderComponent'
import { LlmSegmentedRow } from './llm'
import { UserIconComponent } from './UserIconComponent'
import { UserRowComponent } from './UserRowComponent'
import {
  applyRightsResponse,
  DiscussionRightKey,
  DiscussionRightsPage,
  DiscussionRightsRow,
  isRightsManager,
  MainContext,
  foldSearch,
  parseDiscussionRightsPage,
  rightsLogLabel,
  searchMatchRanges,
  RIGHTS_TABLE_COLUMNS,
  rightKeysFor,
  rightsTableCell,
  RightsLogGroup,
  t,
  Theme,
  useTheme,
  withAlpha,
} from '../lib'

type Props = {
  id: number
}

const COL_W = 28
const DAYS_W = 36
const HEADER_H = 78

const columnLabel = (key: DiscussionRightKey) => {
  if (key === 'read') return t('rights.colRead')
  if (key === 'write') return t('rights.colWrite')
  if (key === 'delete') return t('rights.colDelete')
  if (key === 'edit') return t('rights.colEdit')
  if (key === 'edit_rights') return t('rights.colRights')
  return t('rights.public')
}

const rowLabel = (row: DiscussionRightsRow) => {
  if (row.kind === 'owner' || row.kind === 'user') return row.username
  if (row.kind === 'registered') return t('rights.registered')
  return t('rights.anonymous')
}

const rightLabel = (key: DiscussionRightKey) => t(`rights.${key}`)

const daysLabel = (daysLeft: number | null) => {
  if (daysLeft == null) return ''
  if (daysLeft < 0) return t('rights.daysForever')
  return String(daysLeft)
}

export const DiscussionRightsComponent = ({ id }: Props) => {
  const { nyx, config } = useContext(MainContext)
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = theme
  const [page, setPage] = useState<DiscussionRightsPage>({ rows: [], log: [], canEdit: false })
  const [isFetching, setIsFetching] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tab, setTab] = useState<'list' | 'log'>('list')
  const [selected, setSelected] = useState<DiscussionRightsRow | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [listQuery, setListQuery] = useState('')

  const load = async () => {
    setIsFetching(true)
    try {
      const html = await nyx?.api.getDiscussionRightsPage(id)
      const parsed = parseDiscussionRightsPage(html || '')
      setPage(parsed)
      setLoadError(parsed.rows.length === 0)
      if (parsed.log.length === 0) {
        setTab('list')
      }
    } catch (e) {
      setLoadError(true)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const openRow = (row: DiscussionRightsRow) => {
    if (!page.canEdit || row.kind === 'owner') {
      return
    }
    setSelected(row)
  }

  const toggle = async (row: DiscussionRightsRow, key: DiscussionRightKey) => {
    if (pendingKey) {
      return
    }
    const next = !row.rights[key]
    const previous = row
    const optimistic = { ...row, rights: { ...row.rights, [key]: next } }
    setSelected(optimistic)
    setPage(current => ({
      ...current,
      rows: current.rows.map(item => (sameRow(item, row) ? optimistic : item)),
    }))
    setPendingKey(key)
    const res = await nyx?.api.setDiscussionRight(id, key, next, row.username || undefined)
    if (!res || res.error) {
      setSelected(previous)
      setPage(current => ({
        ...current,
        rows: current.rows.map(item => (sameRow(item, row) ? previous : item)),
      }))
    } else {
      const applied = applyRightsResponse(optimistic, res)
      setSelected(applied)
      setPage(current => ({
        ...current,
        rows: current.rows.map(item => (sameRow(item, row) ? applied : item)),
      }))
    }
    setPendingKey(null)
  }

  const addUser = async (username: string) => {
    if (isAdding) {
      return
    }
    setIsAdding(true)
    const res = await nyx?.api.addDiscussionRights(id, username)
    setIsAdding(false)
    if (!res || res.error) {
      return
    }
    setIsAddOpen(false)
    load()
  }

  const removeUser = async (row: DiscussionRightsRow) => {
    if (isRemoving || pendingKey || !row.username) {
      return
    }
    setIsRemoving(true)
    const res = await nyx?.api.deleteDiscussionRights(id, row.username)
    setIsRemoving(false)
    if (!res || res.error) {
      return
    }
    setSelected(null)
    setPage(current => ({
      ...current,
      rows: current.rows.filter(item => !sameRow(item, row)),
    }))
    load()
  }

  const listNeedle = listQuery.trim()
  const visibleRows = listNeedle
    ? page.rows.filter(row => foldSearch(rowLabel(row)).includes(foldSearch(listNeedle)))
    : page.rows

  const list = (
    <View style={{ flex: 1 }}>
      <RightsTableHeader value={listQuery} onChangeText={setListQuery} />
      <FlatList
        data={visibleRows}
        extraData={{ page, listNeedle }}
        keyExtractor={row => `${row.kind}-${row.username || rowLabel(row)}`}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={load} colors={[colors.primary, colors.secondary, colors.tertiary]} />
        }
        ListEmptyComponent={
          isFetching ? (
            <ActivityIndicator style={{ margin: blocks.large }} size="large" color={colors.primary} />
          ) : loadError ? (
            <Text style={{ margin: blocks.large, fontSize: fontSizes.p }}>{t('rights.loadError')}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableRipple
            disabled={!page.canEdit || item.kind === 'owner'}
            rippleColor={colors.ripple}
            onPress={() => openRow(item)}
            style={{ marginTop: blocks.small }}>
            <View style={{ flexDirection: 'row', alignItems: 'stretch', minHeight: blocks.rowDiscussion }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.row,
                  borderLeftWidth: blocks.small,
                  borderLeftColor: isRightsManager(item) ? colors.primary : 'transparent',
                  borderRadius: 0,
                }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: blocks.medium }}>
                  {(item.kind === 'user' || item.kind === 'owner') && (
                    <UserIconComponent
                      username={item.username}
                      width={blocks.medium * 4}
                      height={blocks.medium * 5}
                      marginRight={10}
                    />
                  )}
                  <Highlighted
                    text={rowLabel(item)}
                    query={listNeedle}
                    numberOfLines={1}
                    style={{ flex: 1, fontSize: fontSizes.p }}
                  />
                </View>
                <View style={{ width: DAYS_W, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: fontSizes.small }}>{daysLabel(item.daysLeft)}</Text>
                </View>
              </View>
              {RIGHTS_TABLE_COLUMNS.map(key => {
                const state = rightsTableCell(item, key)
                return (
                  <View
                    key={key}
                    style={{
                      width: COL_W,
                      marginLeft: blocks.small,
                      borderWidth: 0,
                      borderRadius: 0,
                      backgroundColor: state == null ? 'transparent' : state ? colors.primary : colors.border,
                    }}
                  />
                )
              })}
            </View>
          </TouchableRipple>
        )}
      />
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {page.log.length > 0 && (
        <LlmSegmentedRow
          value={tab}
          onChange={next => {
            setTab(next)
            load()
          }}
          options={[
            { key: 'list', label: t('rights.list') },
            { key: 'log', label: t('rights.log') },
          ]}
        />
      )}
      {tab === 'list' || page.log.length === 0 ? list : <RightsLog log={page.log} refreshing={isFetching} onRefresh={load} />}
      <RightsDialog
        row={selected}
        pendingKey={pendingKey}
        removing={isRemoving}
        onDismiss={() => (pendingKey || isRemoving ? null : setSelected(null))}
        onToggle={toggle}
        onRemove={removeUser}
      />
      <AddUserDialog
        visible={isAddOpen}
        pending={isAdding}
        theme={theme}
        onDismiss={() => !isAdding && setIsAddOpen(false)}
        onPick={addUser}
      />
      <Portal>
        <FAB
          icon="plus"
          visible={tab === 'list' && page.canEdit && !isAddOpen}
          style={{
            position: 'absolute',
            right: 16,
            bottom: (config?.isBottomTabs ? 45 : 0) + Math.max(insets.bottom, androidStackBottomInset),
            backgroundColor: colors.primary,
          }}
          onPress={() => setIsAddOpen(true)}
        />
      </Portal>
    </View>
  )
}

const sameRow = (a: DiscussionRightsRow, b: DiscussionRightsRow) => a.kind === b.kind && a.username === b.username

const VerticalHeader = ({ label, width, marginLeft }: { label: string; width: number; marginLeft: number }) => {
  const {
    colors,
    metrics: { fontSizes },
  } = useTheme()
  return (
    <View style={{ width, height: HEADER_H, marginLeft, alignItems: 'center', justifyContent: 'center' }}>
      <Text
        numberOfLines={1}
        style={{
          width: HEADER_H,
          textAlign: 'center',
          fontSize: fontSizes.small,
          color: colors.faded,
          transform: [{ rotate: '-90deg' }],
        }}>
        {label}
      </Text>
    </View>
  )
}

const RightsTableHeader = ({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) => {
  const {
    colors,
    metrics: { blocks },
  } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end' }}>
        <TextInput
          numberOfLines={1}
          textAlignVertical="center"
          selectionColor={colors.primary}
          onChangeText={onChangeText}
          value={value}
          placeholder={t('rights.logSearch')}
          style={{
            flex: 1,
            height: 42,
            marginLeft: blocks.small,
            marginRight: blocks.small,
            marginBottom: blocks.small,
            backgroundColor: 'inherit',
            borderRadius: 0,
          }}
        />
        <VerticalHeader label={t('rights.colDays')} width={DAYS_W} marginLeft={0} />
      </View>
      {RIGHTS_TABLE_COLUMNS.map(key => (
        <VerticalHeader key={key} label={columnLabel(key)} width={COL_W} marginLeft={blocks.small} />
      ))}
    </View>
  )
}

const logLine = (action: { op: 'add' | 'remove'; label: string; username?: string }) =>
  `${action.op === 'remove' ? '−' : '+'} ${action.username ? `${action.username} ` : ''}${rightsLogLabel(action.label, t('rights.logBoard'))}`

const logEntryMatches = (group: RightsLogGroup, entry: RightsLogGroup['entries'][number], query: string) => {
  const needle = foldSearch(query.trim())
  if (!needle) {
    return true
  }
  const hay = foldSearch([group.date, entry.username, ...entry.actions.map(logLine)].join('\n'))
  return hay.includes(needle)
}

const Highlighted = ({
  text,
  query,
  style,
  numberOfLines,
}: {
  text: string
  query: string
  style?: object
  numberOfLines?: number
}) => {
  const {
    colors,
  } = useTheme()
  const ranges = searchMatchRanges(text, query)
  if (ranges.length === 0) {
    return (
      <Text numberOfLines={numberOfLines} style={style}>
        {text}
      </Text>
    )
  }
  const parts: React.ReactNode[] = []
  let from = 0
  ranges.forEach(([start, end], key) => {
    if (start > from) {
      parts.push(text.slice(from, start))
    }
    parts.push(
      <Text key={key} style={{ backgroundColor: withAlpha(colors.tertiary, 0.5) }}>
        {text.slice(start, end)}
      </Text>,
    )
    from = end
  })
  if (from < text.length) {
    parts.push(text.slice(from))
  }
  return (
    <Text numberOfLines={numberOfLines} style={style}>
      {parts}
    </Text>
  )
}

const RightsLog = ({ log, refreshing, onRefresh }: { log: RightsLogGroup[]; refreshing: boolean; onRefresh: () => void }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const [query, setQuery] = useState('')
  const needle = query.trim()
  const visible = needle
    ? log
        .map(group => ({ ...group, entries: group.entries.filter(entry => logEntryMatches(group, entry, needle)) }))
        .filter(group => group.entries.length > 0)
    : log
  return (
    <View style={{ flex: 1 }}>
      <TextInput
        numberOfLines={1}
        textAlignVertical="center"
        selectionColor={colors.primary}
        onChangeText={setQuery}
        value={query}
        placeholder={t('rights.logSearch')}
        style={{ margin: blocks.small, height: 42, backgroundColor: 'inherit', borderRadius: 0 }}
      />
      <ScrollView
      style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary, colors.secondary, colors.tertiary]} />}>
      {visible.map(group => (
        <View key={group.date || group.entries[0]?.username}>
          {group.entries.map(entry => (
            <View
              key={`${group.date}-${entry.username}-${entry.actions.map(action => action.label).join('|')}`}
              style={{
                backgroundColor: colors.row,
                borderLeftWidth: blocks.small,
                borderColor: colors.primary,
                borderRadius: 0,
                paddingVertical: blocks.medium,
                paddingHorizontal: blocks.medium,
                marginBottom: blocks.small,
              }}>
              {(!!entry.username || !!group.date) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: entry.actions.length ? blocks.small : 0 }}>
                  {!!entry.username && (
                    <UserIconComponent username={entry.username} width={blocks.medium * 4} height={blocks.medium * 5} marginRight={10} />
                  )}
                  <Highlighted
                    text={entry.username}
                    query={needle}
                    numberOfLines={1}
                    style={{ flex: 1, fontSize: fontSizes.p }}
                  />
                  {!!group.date && (
                    <Highlighted
                      text={group.date}
                      query={needle}
                      style={{ flexShrink: 0, fontSize: fontSizes.small, color: colors.faded, marginLeft: blocks.medium }}
                    />
                  )}
                </View>
              )}
              {entry.actions.map(action => (
                <Highlighted
                  key={`${action.op}-${action.username || ''}-${action.label}`}
                  text={logLine(action)}
                  query={needle}
                  style={{ fontSize: fontSizes.p, color: action.op === 'remove' ? colors.error : colors.primary }}
                />
              ))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
    </View>
  )
}

const RightsDialog = ({
  row,
  pendingKey,
  removing,
  onDismiss,
  onToggle,
  onRemove,
}: {
  row: DiscussionRightsRow | null
  pendingKey: string | null
  removing: boolean
  onDismiss: () => void
  onToggle: (row: DiscussionRightsRow, key: DiscussionRightKey) => void
  onRemove: (row: DiscussionRightsRow) => void
}) => {
  const theme = useTheme()
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = theme
  return (
    <Portal>
      <Dialog visible={!!row} onDismiss={onDismiss} style={{ borderRadius: 0, backgroundColor: colors.background }}>
        <Dialog.ScrollArea style={{ paddingHorizontal: 5, borderRadius: 0 }}>
          <ScrollView style={{ marginVertical: 5 }}>
            {!!row && (
              <View
                style={{
                  minHeight: fontSizes.h1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: blocks.medium,
                  paddingVertical: blocks.small,
                }}>
                <Text numberOfLines={1} style={{ flex: 1, fontSize: fontSizes.p, marginRight: blocks.medium }}>
                  {rowLabel(row)}
                </Text>
                {row.kind === 'user' && !!row.username && (
                  <DoubleTapDeleteButton
                    label={t('rights.removeUser')}
                    onDelete={() => onRemove(row)}
                    disabled={!!pendingKey || removing}
                  />
                )}
              </View>
            )}
            {row &&
              rightKeysFor(row).map(key => {
                const on = !!row.rights[key]
                return (
                  <TouchableRipple
                    key={key}
                    rippleColor={colors.ripple}
                    disabled={!!pendingKey}
                    onPress={() => onToggle(row, key)}
                    style={{
                      backgroundColor: colors.row,
                      borderLeftWidth: blocks.small,
                      borderColor: on ? colors.primary : 'transparent',
                      borderRadius: 0,
                      marginTop: blocks.small,
                      opacity: on ? 1 : 0.5,
                    }}>
                    <View
                      style={{
                        minHeight: blocks.rowDiscussion,
                        paddingHorizontal: blocks.medium,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <Text style={{ flex: 1, fontSize: fontSizes.p, marginRight: blocks.medium }}>{rightLabel(key)}</Text>
                      {pendingKey === key ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <Icon name={on ? 'check' : 'x'} size={fontSizes.h1} color={on ? colors.primary : colors.faded} />
                      )}
                    </View>
                  </TouchableRipple>
                )
              })}
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  )
}

const AddUserDialog = ({
  visible,
  pending,
  theme,
  onDismiss,
  onPick,
}: {
  visible: boolean
  pending: boolean
  theme: Theme
  onDismiss: () => void
  onPick: (username: string) => void
}) => {
  const nyx = useContext(MainContext).nyx
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = theme
  const [phrase, setPhrase] = useState('')
  const [users, setUsers] = useState<{ username: string }[]>([])
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    if (!visible) {
      setPhrase('')
      setUsers([])
      setIsFetching(false)
    }
  }, [visible])

  const searchUsername = async (value: string) => {
    setPhrase(value)
    if (!value) {
      setUsers([])
      setIsFetching(false)
      return
    }
    setIsFetching(true)
    const res = await nyx?.api.search(value, false, true)
    if (res?.exact) {
      setUsers([...(res.exact || []), ...(res.friends || []), ...(res.others || [])])
    } else if (!value) {
      setUsers([])
    }
    setIsFetching(false)
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ borderRadius: 0, backgroundColor: colors.background }}>
        <View style={{ minHeight: fontSizes.h1, justifyContent: 'center', paddingHorizontal: blocks.medium, paddingVertical: blocks.small }}>
          <Text numberOfLines={1} style={{ fontSize: fontSizes.p }}>
            {t('rights.addUser')}
          </Text>
        </View>
        <Dialog.ScrollArea style={{ paddingHorizontal: 5, borderRadius: 0 }}>
          <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="always" style={{ marginVertical: 5, maxHeight: 360 }}>
            <TextInput
              numberOfLines={1}
              textAlignVertical="center"
              selectionColor={colors.primary}
              onChangeText={searchUsername}
              value={phrase}
              placeholder={t('username')}
              style={{ marginBottom: 3, height: 42, backgroundColor: 'inherit', borderRadius: 0 }}
            />
            {isFetching && <LoaderComponent theme={theme} height={48} />}
            {users.map(user => (
              <UserRowComponent
                key={user.username}
                user={user}
                theme={theme}
                isPressable={!pending}
                onPress={() => onPick(user.username)}
              />
            ))}
            {pending && <ActivityIndicator style={{ margin: blocks.medium }} color={colors.primary} />}
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  )
}
