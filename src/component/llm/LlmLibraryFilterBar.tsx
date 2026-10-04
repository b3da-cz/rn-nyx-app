import React from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { t, useTheme } from '../../lib'

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
  const { colors, metrics } = useTheme()

  const sortOptions: { id: SortOrder; label: string }[] = [
    { id: 'newest', label: t('llm.sortNewest') || 'Nejnovější' },
    { id: 'oldest', label: t('llm.sortOldest') || 'Nejstarší' },
    { id: 'discussion', label: t('llm.sortDiscussion') || 'Diskuze' },
    { id: 'duration', label: t('llm.sortDuration') || 'Trvání' },
  ]

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.disabled }]}>
      <View style={[styles.searchRow, { backgroundColor: colors.background, borderColor: colors.disabled }]}>
        <Icon name="search" size={16} color={colors.faded} style={{ marginRight: 8 }} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={t('llm.searchHistoryPlaceholder') || 'Hledat v dotazech a odpovědích...'}
          placeholderTextColor={colors.faded}
          style={[styles.searchInput, { color: colors.text, fontSize: metrics.fontSizes.small }]}
        />
        {!!search && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={{ padding: 4 }}>
            <Icon name="x" size={14} color={colors.faded} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersRow}>
        {hasActiveDiscussion && (
          <View style={[styles.scopeWrap, { borderColor: colors.disabled }]}>
            <TouchableOpacity
              onPress={() => onScopeChange('discussion')}
              style={[
                styles.scopeBtn,
                { backgroundColor: scope === 'discussion' ? colors.primary : colors.background },
              ]}>
              <Text
                style={{
                  color: scope === 'discussion' ? '#FFFFFF' : colors.faded,
                  fontSize: 11,
                  fontWeight: scope === 'discussion' ? 'bold' : 'normal',
                }}>
                {t('llm.filterCurrentDiscussion') || 'Tato diskuze'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onScopeChange('all')}
              style={[styles.scopeBtn, { backgroundColor: scope === 'all' ? colors.primary : colors.background }]}>
              <Text
                style={{
                  color: scope === 'all' ? '#FFFFFF' : colors.faded,
                  fontSize: 11,
                  fontWeight: scope === 'all' ? 'bold' : 'normal',
                }}>
                {t('llm.filterAllDiscussions') || 'Všechny'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sortRow}>
          {sortOptions.map(opt => {
            const isSelected = sort === opt.id
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => onSortChange(opt.id)}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.disabled,
                  },
                ]}>
                <Text style={{ color: isSelected ? '#FFFFFF' : colors.faded, fontSize: 10 }}>{opt.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    height: 38,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 4,
  },
  filtersRow: {
    gap: 8,
  },
  scopeWrap: {
    flexDirection: 'row',
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  sortChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
})
