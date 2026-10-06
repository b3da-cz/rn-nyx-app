import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Button, Text } from 'react-native-paper'
import { LlmQueue, Styling, t, useTheme } from '../../lib'
import { ButtonComponent } from '../ButtonComponent'
import { LlmDateFilterBar } from './LlmDateFilterBar'
import { LlmModelBar } from './LlmModelBar'
import { LlmPendingItemCard } from './LlmPendingItemCard'
import { LlmPromptInput } from './LlmPromptInput'
import { LlmResultSection } from './LlmResultSection'
import { LlmSystemPromptBar } from './LlmSystemPromptBar'
import { useLlmAssistant } from './useLlmAssistant'

type Props = {
  discussionId: number | string
  discussionTitle: string
  posts: any[]
  apiKey: string
  defaultModelId: string
  defaultModelName?: string
  systemPrompt?: string
  prompt: string
  onChangePrompt: (val: string) => void
  onLoadMorePosts?: () => Promise<number>
  onNavigateToPost?: (discussionId: number | string, postId?: number | string) => void
  onHistoryEntryAdded?: () => void
  onPromptFocus?: () => void
  onPromptLayout?: (y: number) => void
}

export const LlmAssistantTab: React.FC<Props> = props => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const a = useLlmAssistant(props)
  const { dateFilter, model, system } = a

  return (
    <View style={{ paddingBottom: blocks.xlarge }}>
      <LlmModelBar
        apiKey={props.apiKey}
        currentModelId={model.modelId}
        currentModelName={model.modelName}
        isGlobalModel={model.isGlobalModel}
        onModelSelected={(m, saveAsGlobal) => {
          void model.chooseModel(m.id, m.name, saveAsGlobal)
        }}
      />
      <LlmSystemPromptBar
        systemPrompt={system.systemPrompt}
        isGlobalSystemPrompt={system.isGlobalSystemPrompt}
        onSystemPromptSave={(prompt, saveAsDefault) => {
          void system.saveSystemPrompt(prompt, saveAsDefault)
        }}
      />
      <LlmDateFilterBar
        datePreset={dateFilter.datePreset}
        dateFrom={dateFilter.dateFrom}
        dateTo={dateFilter.dateTo}
        onPresetChange={dateFilter.applyPreset}
        onDateFromChange={dateFilter.setDateFrom}
        onDateToChange={dateFilter.setDateTo}
      />

      <View style={[Styling.groups.flexRowSpbCentered, { minHeight: 40, paddingLeft: blocks.medium }]}>
        <Text style={{ flex: 1, color: colors.faded, fontSize: fontSizes.small }}>
          {a.postCount > 0
            ? `${t('llm.postsCount')}`.replace('%s', `${a.postCount}`).replace('%s', `${a.wordCount}`)
            : t('llm.noPosts')}
        </Text>
        {a.canLoadOlder &&
          (a.isLoadingOlder ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginHorizontal: blocks.large }} />
          ) : (
            <Button uppercase={false} color={colors.accent} onPress={a.loadOlder}>
              {t('llm.loadOlder')}
            </Button>
          ))}
      </View>

      <View onLayout={e => props.onPromptLayout?.(e.nativeEvent.layout.y)}>
        <LlmPromptInput
          prompt={props.prompt}
          onChangePrompt={props.onChangePrompt}
          onFocus={props.onPromptFocus}
          disabled={a.isSending}
        />
      </View>

      <View style={{ flexDirection: 'row', marginTop: blocks.medium }}>
        <ButtonComponent
          label={t('search.clear')}
          color={colors.faded}
          fontSize={fontSizes.p}
          width={'50%'}
          onPress={() => props.onChangePrompt('')}
        />
        <ButtonComponent
          label={a.isSending ? t('llm.sending') : t('llm.send')}
          color={a.canSend ? colors.accent : colors.disabled}
          isDisabled={!a.canSend}
          fontSize={fontSizes.p}
          width={'50%'}
          onPress={a.send}
        />
      </View>

      {!!a.activeTask && (
        <LlmPendingItemCard
          task={a.activeTask}
          onRetry={taskId => LlmQueue.retryTask(taskId)}
          onDismiss={taskId => LlmQueue.dismissTask(taskId)}
        />
      )}

      {!!a.errorMessage && (
        <Text
          selectable
          style={{ color: colors.error, fontSize: fontSizes.small, paddingHorizontal: blocks.medium }}>
          {a.errorMessage}
        </Text>
      )}

      {!!a.result && (
        <LlmResultSection
          result={a.result.text}
          usage={a.result.usage}
          durationMs={a.result.durationMs}
          onNewQuery={a.clearResult}
          onNavigateToPost={props.onNavigateToPost}
        />
      )}
    </View>
  )
}
