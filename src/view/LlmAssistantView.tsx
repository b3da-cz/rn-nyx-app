import React, { useContext, useEffect, useRef, useState } from 'react'
import { Keyboard, ScrollView, View } from 'react-native'
import { IconButton, Text } from 'react-native-paper'
import { MainContext, Styling, t, useTheme } from '../lib'
import { LlmAssistantTab, LlmLibraryTab, LlmSegmentedRow } from '../component/llm'

type Props = {
  navigation: any
  discussionId?: number | string
  discussionTitle?: string
  initialPosts?: any[]
}

type TabType = 'assistant' | 'library'

export const LlmAssistantView: React.FC<Props> = ({ navigation, discussionId, discussionTitle, initialPosts = [] }) => {
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
    if (initialPosts.length > 0) {
      setPosts(initialPosts)
    } else if (discussionId && nyx) {
      nyx.api
        .getDiscussion(`${discussionId}`)
        .then((res: any) => {
          if (res?.posts?.length) {
            setPosts(res.posts)
          }
        })
        .catch((e: any) => console.warn('Failed to fetch initial posts for LLM', e))
    }
  }, [discussionId, initialPosts, nyx])

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
      <View style={[Styling.groups.flexRowCentered, { height: 50 }]}>
        <IconButton
          icon={'arrow-left'}
          size={25}
          style={{ marginLeft: 10 }}
          color={colors.primary}
          rippleColor={colors.ripple}
          onPress={() => navigation.goBack()}
        />
        <Text numberOfLines={1} style={{ flex: 1, fontSize: fontSizes.p + 2, marginHorizontal: blocks.large }}>
          {discussionTitle || t('llm.title')}
        </Text>
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
      {activeTab === 'assistant' ? (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 12 }}
          keyboardShouldPersistTaps="handled">
          <LlmAssistantTab
            discussionId={discussionId || ''}
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
          />
        </ScrollView>
      ) : (
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
