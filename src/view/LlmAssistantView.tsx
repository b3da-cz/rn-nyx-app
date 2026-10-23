import React, { useContext, useEffect, useRef, useState } from 'react'
import { Keyboard, ScrollView, View } from 'react-native'
import { IconButton, Text } from 'react-native-paper'
import {
  AgentRule,
  agentRuleSource,
  canUseAgent,
  defaultAgentRule,
  emptyViewerRights,
  formatAgentTtlLabel,
  MainContext,
  parseAgentRule,
  showNotificationBanner,
  signedInUsername,
  Styling,
  t,
  useTheme,
  ViewerClubRights,
  viewerRightsFromDiscussion,
} from '../lib'
import { LlmAssistantTab, LlmLibraryTab, LlmSegmentedRow } from '../component/llm'

type Props = {
  navigation: any
  discussionId?: number | string
  discussionTitle?: string
  initialPosts?: any[]
  agentRule?: AgentRule
  viewerRights?: ViewerClubRights
}

type TabType = 'assistant' | 'library'

export const LlmAssistantView: React.FC<Props> = ({
  navigation,
  discussionId,
  discussionTitle,
  initialPosts = [],
  agentRule,
  viewerRights,
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const context = useContext(MainContext)
  const config = context?.config || {}
  const nyx = context?.nyx

  const [activeTab, setActiveTab] = useState<TabType>(discussionId ? 'assistant' : 'library')
  const [prompt, setPrompt] = useState('')
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [historyCount, setHistoryCount] = useState(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [rule, setRule] = useState<AgentRule>(agentRule || defaultAgentRule())
  const [rights, setRights] = useState<ViewerClubRights>(viewerRights || emptyViewerRights(signedInUsername(nyx)))
  const [policyReady, setPolicyReady] = useState(!discussionId || !!agentRule)
  const [verifyFailed, setVerifyFailed] = useState(false)
  const deniedNotice = useRef(false)

  const seededPosts = useRef(initialPosts)
  const isPromptFocusedRef = useRef(false)
  const promptLayoutYRef = useRef(0)
  const scrollRef = useRef<ScrollView>(null)

  const scrollToPrompt = () =>
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, promptLayoutYRef.current - 8), animated: true })
    }, 50)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardHeight(e.endCoordinates.height)
      if (isPromptFocusedRef.current) {
        scrollToPrompt()
      }
    })
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0)
      isPromptFocusedRef.current = false
    })
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  useEffect(() => {
    if (seededPosts.current.length > 0) {
      setPosts(seededPosts.current)
    }
    if (!discussionId) {
      setPolicyReady(true)
      return
    }
    if (!nyx) {
      return
    }
    let cancelled = false
    const hadRule = !!agentRule
    nyx.api
      .getDiscussion(`${discussionId}`)
      .then((res: any) => {
        if (cancelled) {
          return
        }
        if (!res?.discussion_common) {
          if (!hadRule) {
            setVerifyFailed(true)
            setPolicyReady(true)
          }
          return
        }
        setRule(parseAgentRule(agentRuleSource(res.discussion_common.discussion_specific_data?.header)))
        setRights(viewerRightsFromDiscussion(res.discussion_common, signedInUsername(nyx)))
        setVerifyFailed(false)
        setPolicyReady(true)
        if (seededPosts.current.length === 0 && res?.posts?.length) {
          setPosts(res.posts)
        }
      })
      .catch((e: any) => {
        console.warn('Failed to read club agent rules', e)
        if (cancelled) {
          return
        }
        if (!hadRule) {
          setVerifyFailed(true)
          setPolicyReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [discussionId, nyx, agentRule])

  const agentAllowed = !discussionId || (policyReady && !verifyFailed && canUseAgent(rule, rights))
  const rightsDenied = !!discussionId && policyReady && !verifyFailed && !agentAllowed
  const ttlLabel = formatAgentTtlLabel(rule)
  const blockMessage = !discussionId
    ? undefined
    : verifyFailed
      ? t('llm.agentsVerifyFailed')
      : policyReady && !agentAllowed
        ? t('llm.agentsDeniedBody')
        : undefined

  useEffect(() => {
    if (!rightsDenied || deniedNotice.current) {
      return
    }
    deniedNotice.current = true
    showNotificationBanner({
      title: t('llm.agentsDeniedTitle'),
      body: t('llm.agentsDeniedBody'),
      tintColor: colors.error,
      icon: 'slash',
    })
  }, [rightsDenied, colors.error])

  const handleLoadOlderPosts = async (): Promise<number> => {
    if (!discussionId || !nyx || posts.length === 0) {
      return 0
    }
    const bottomPostId = posts[posts.length - 1].id
    const res: any = await nyx.api.getDiscussion(`${discussionId}?order=older_than&from_id=${bottomPostId}`)
    if (res?.posts?.length > 0) {
      setPosts(prev => [...prev, ...res.posts])
      return res.posts.length
    }
    return 0
  }

  const handleNavigateToPost = (navDiscussionId: number | string, postId?: number | string) => {
    navigation.push('discussion', {
      discussionId: Number(navDiscussionId),
      postId: postId ? Number(postId) : undefined,
    })
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[Styling.groups.flexRowCentered, { minHeight: 50 }]}>
        <IconButton
          icon={'arrow-left'}
          size={25}
          style={{ marginLeft: 10 }}
          color={colors.primary}
          rippleColor={colors.ripple}
          onPress={() => navigation.goBack()}
        />
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontSize: fontSizes.p + 2, marginLeft: blocks.large, marginRight: blocks.small }}>
          {discussionTitle || t('llm.title')}
        </Text>
        {!!discussionId && rule.found && (
          <View style={{ alignItems: 'flex-end', marginRight: blocks.medium }}>
            <Text style={{ color: rightsDenied ? colors.error : colors.text, fontSize: fontSizes.small }}>{rule.role}</Text>
            {!!ttlLabel && (
              <Text style={{ color: colors.error, fontSize: fontSizes.small }}>{ttlLabel}</Text>
            )}
          </View>
        )}
      </View>
      {!!discussionId && (
        <LlmSegmentedRow
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { key: 'assistant', label: t('llm.tabAssistant') },
            { key: 'library', label: `${t('llm.tabLibrary')}${historyCount > 0 ? ` (${historyCount})` : ''}` },
          ]}
        />
      )}
      {!!discussionId && (
        <View style={{ flex: 1, display: activeTab === 'assistant' ? 'flex' : 'none' }}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 12 }}
            keyboardShouldPersistTaps="handled">
            <LlmAssistantTab
              discussionId={discussionId}
              discussionTitle={discussionTitle || ''}
              posts={posts}
              apiKey={config.openRouterApiKey || ''}
              defaultModelId={config.selectedLlmModel || ''}
              defaultModelName={config.selectedLlmModelName}
              systemPrompt={config.llmSystemPrompt}
              prompt={prompt}
              onChangePrompt={setPrompt}
              onLoadMorePosts={handleLoadOlderPosts}
              onNavigateToPost={handleNavigateToPost}
              onPromptFocus={() => {
                isPromptFocusedRef.current = true
                scrollToPrompt()
              }}
              onPromptLayout={y => {
                promptLayoutYRef.current = y
              }}
              agentAllowed={agentAllowed}
              ttlMs={rule.found ? rule.ttlMs : 0}
              blockMessage={blockMessage}
            />
          </ScrollView>
        </View>
      )}
      {activeTab !== 'assistant' && (
        <LlmLibraryTab
          activeDiscussionId={discussionId}
          onUsePrompt={usedPrompt => {
            setPrompt(usedPrompt)
            setActiveTab('assistant')
          }}
          onNavigateToPost={handleNavigateToPost}
          onCountChange={setHistoryCount}
        />
      )}
    </View>
  )
}
