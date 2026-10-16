import React from 'react'
import { View } from 'react-native'
import { t, useTheme } from '../../lib'
import { FormRowSelectComponent } from '../FormRowSelectComponent'
import { SearchFieldComponent } from '../SearchFieldComponent'
import { LlmFormRow } from './LlmFormRow'
import { LlmSegmentedRow } from './LlmSegmentedRow'

export type SortOrder = 'newest' | 'oldest' | 'discussion' | 'duration'
export type ScopeFilter = 'discussion' | 'all'

type Props = {
  search: string
  onSearchChange: (val: string) => void
  scope: ScopeFilter
  onScopeChange: (scope: ScopeFilter) => void
  sort: SortOrder
  onSortChange: (sort: SortOrder) => void
  hasActiveDiscussion: boolean
}

export const LlmLibraryFilterBar: React.FC<Props> = ({
  search,
  onSearchChange,
  scope,
  onScopeChange,
  sort,
  onSortChange,
  hasActiveDiscussion,
}) => {
  const {
    metrics: { blocks },
  } = useTheme()

  const sortOptions: { value: SortOrder; label: string }[] = [
    { value: 'newest', label: t('llm.sortNewest') },
    { value: 'oldest', label: t('llm.sortOldest') },
    { value: 'discussion', label: t('llm.sortDiscussion') },
    { value: 'duration', label: t('llm.sortDuration') },
  ]

  return (
    <View>
      <SearchFieldComponent
        value={search}
        onChangeText={onSearchChange}
        placeholder={t('llm.searchHistoryPlaceholder')}
        style={{ marginBottom: blocks.small }}
      />
      {hasActiveDiscussion && (
        <LlmSegmentedRow
          value={scope}
          onChange={onScopeChange}
          options={[
            { key: 'discussion', label: t('llm.filterCurrentDiscussion') },
            { key: 'all', label: t('llm.filterAllDiscussions') },
          ]}
        />
      )}
      <LlmFormRow label={t('llm.sortBy')}>
        <FormRowSelectComponent
          value={sortOptions.find(option => option.value === sort)?.label}
          options={sortOptions}
          onSelect={(value: SortOrder) => onSortChange(value)}
        />
      </LlmFormRow>
    </View>
  )
}
