import React, { useContext, useEffect, useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { MainContext, t, useTheme } from '../lib'
import { LlmAssistantTab, LlmLibraryTab } from '../component/llm'

type Props = {
  navigation: any
  discussionId?: number | string
  discussionTitle?: string
  initialPosts?: any[]
}

type TabType = 'assistant' | 'library'

export const LlmAssistantView: React.FC<Props> = ({
  navigation,
  discussionId,
  discussionTitle,
  initialPosts = [],
}) => {
  const { colors, metrics } = useTheme()
  const context = useContext(MainContext)
  const config = context?.config || {}
  const nyx = context?.nyx

  const [activeTab, setActiveTab] = useState<TabType>(discussionId ? 'assistant' : 'library')
  const [prompt, setPrompt] = useState('')
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [historyCount, setHistoryCount] = useState(0)

  useEffect(() => {
    if (initialPosts.length > 0) {
      setPosts(initialPosts)
    } else if (discussionId && nyx) {
      nyx.api.getDiscussion(`${discussionId}`).then((res: any) => {
        if (res?.posts?.length) {
          setPosts(res.posts)
        }
      }).catch((e: any) => console.warn('Failed to fetch initial posts for LLM', e))
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

  const handleUsePromptFromLibrary = (usedPrompt: string) => {
    setPrompt(usedPrompt)
    setActiveTab('assistant')
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.disabled }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text, fontSize: metrics.fontSizes.h3 }]}>
            {t('llm.title') || 'LLM Asistent'}
          </Text>
          {!!discussionTitle && (
            <Text numberOfLines={1} style={[styles.subtitle, { color: colors.faded, fontSize: metrics.fontSizes.small - 1 }]}>
              {discussionTitle}
            </Text>
          )}
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { borderBottomColor: colors.disabled }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('assistant')}
          style={[
            styles.tabItem,
            activeTab === 'assistant' && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
          ]}>
          <Icon
            name="message-square"
            size={16}
            color={activeTab === 'assistant' ? colors.primary : colors.faded}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: activeTab === 'assistant' ? colors.text : colors.faded,
              fontSize: metrics.fontSizes.small,
              fontWeight: activeTab === 'assistant' ? 'bold' : 'normal',
            }}>
            {t('llm.tabAssistant') || 'Asistent'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('library')}
          style={[
            styles.tabItem,
            activeTab === 'library' && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
          ]}>
          <Icon
            name="archive"
            size={16}
            color={activeTab === 'library' ? colors.primary : colors.faded}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: activeTab === 'library' ? colors.text : colors.faded,
              fontSize: metrics.fontSizes.small,
              fontWeight: activeTab === 'library' ? 'bold' : 'normal',
            }}>
            {`${t('llm.tabLibrary') || 'Library'}${historyCount > 0 ? ` (${historyCount})` : ''}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.contentWrap}>
        {activeTab === 'assistant' ? (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
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
            />
          </ScrollView>
        ) : (
          <View style={styles.libraryWrap}>
            <LlmLibraryTab
              activeDiscussionId={discussionId}
              onUsePrompt={handleUsePromptFromLibrary}
              onNavigateToPost={handleNavigateToPost}
              onCountChange={setHistoryCount}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: 4 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, paddingRight: 12 },
  title: { fontWeight: 'bold' },
  subtitle: { marginTop: 1 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  contentWrap: { flex: 1 },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 12 },
  libraryWrap: { flex: 1, padding: 12 },
})
