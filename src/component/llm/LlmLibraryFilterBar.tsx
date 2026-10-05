import React from 'react'
import { TextInput, View } from 'react-native'
import { IconButton } from 'react-native-paper'
import { t, useTheme } from '../../lib'
import { FormRowSelectComponent } from '../FormRowSelectComponent'
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
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()

  const sortOptions: { value: SortOrder; label: string }[] = [
    { value: 'newest', label: t('llm.sortNewest') },
    { value: 'oldest', label: t('llm.sortOldest') },
    { value: 'discussion', label: t('llm.sortDiscussion') },
    { value: 'duration', label: t('llm.sortDuration') },
  ]

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: blocks.medium,
          marginBottom: blocks.small,
          height: 42,
        }}>
        <TextInput
          numberOfLines={1}
          textAlignVertical={'center'}
          selectionColor={colors.primary}
          value={search}
          onChangeText={onSearchChange}
          placeholder={t('llm.searchHistoryPlaceholder')}
          placeholderTextColor={colors.faded}
          style={{ flex: 1, height: 42, color: colors.text, fontSize: fontSizes.p }}
        />
        {!!search && (
          <IconButton icon={'close'} size={18} color={colors.faded} onPress={() => onSearchChange('')} />
        )}
      </View>
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
