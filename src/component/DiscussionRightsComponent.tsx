import React, { useContext, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, View } from 'react-native'
import { Dialog, Portal, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { LlmSegmentedRow } from './llm'
import { UserIconComponent } from './UserIconComponent'
import {
  applyRightsResponse,
  DiscussionRightKey,
  DiscussionRightsPage,
  DiscussionRightsRow,
  isRightsManager,
  MainContext,
  parseDiscussionRightsPage,
  RIGHTS_TABLE_COLUMNS,
  rightKeysFor,
  rightsTableCell,
  RightsLogGroup,
  t,
  useTheme,
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
  const nyx = useContext(MainContext).nyx
  const theme = useTheme()
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

  const list = (
    <View style={{ flex: 1 }}>
      <RightsTableHeader />
      <FlatList
        data={page.rows}
        extraData={page}
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
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: fontSizes.p }}>
                    {rowLabel(item)}
                  </Text>
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
        onDismiss={() => pendingKey || setSelected(null)}
        onToggle={toggle}
      />
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

const RightsTableHeader = () => {
  const {
    metrics: { blocks },
  } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <VerticalHeader label={t('rights.colDays')} width={DAYS_W} marginLeft={0} />
      </View>
      {RIGHTS_TABLE_COLUMNS.map(key => (
        <VerticalHeader key={key} label={columnLabel(key)} width={COL_W} marginLeft={blocks.small} />
      ))}
    </View>
  )
}

const RightsLog = ({ log, refreshing, onRefresh }: { log: RightsLogGroup[]; refreshing: boolean; onRefresh: () => void }) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary, colors.secondary, colors.tertiary]} />}>
      {log.map(group => (
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
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: fontSizes.p }}>
                    {entry.username}
                  </Text>
                  {!!group.date && (
                    <Text style={{ flexShrink: 0, fontSize: fontSizes.small, color: colors.faded, marginLeft: blocks.medium }}>
                      {group.date}
                    </Text>
                  )}
                </View>
              )}
              {entry.actions.map(action => (
                <Text
                  key={`${action.op}-${action.username || ''}-${action.label}`}
                  style={{ fontSize: fontSizes.p, color: action.op === 'remove' ? colors.error : colors.primary }}>
                  {`${action.op === 'remove' ? '−' : '+'} ${action.username ? `${action.username} ` : ''}${action.label}`}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const RightsDialog = ({
  row,
  pendingKey,
  onDismiss,
  onToggle,
}: {
  row: DiscussionRightsRow | null
  pendingKey: string | null
  onDismiss: () => void
  onToggle: (row: DiscussionRightsRow, key: DiscussionRightKey) => void
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
              <View style={{ minHeight: fontSizes.h1, justifyContent: 'center', paddingHorizontal: blocks.medium, paddingVertical: blocks.small }}>
                <Text numberOfLines={1} style={{ fontSize: fontSizes.p }}>
                  {rowLabel(row)}
                </Text>
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
