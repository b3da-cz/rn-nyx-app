import React from 'react'
import { StyleSheet, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { showNotificationBanner, t, useTheme } from '../lib'
import { LlmLibraryTab } from '../component/llm'

type Props = {
  navigation: any
}

export const LlmLibraryView: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme()

  const handleNavigateToPost = (discussionId: number | string, postId?: number | string) => {
    navigation.push('discussion', {
      discussionId: Number(discussionId),
      postId: postId ? Number(postId) : undefined,
    })
  }

  const handleUsePrompt = (prompt: string) => {
    Clipboard.setString(prompt)
    try {
      showNotificationBanner({
        title: t('llm.copied'),
        body: prompt.length > 80 ? `${prompt.substring(0, 80)}...` : prompt,
        tintColor: colors.primary,
        icon: 'copy',
        onClick: () => {},
      })
    } catch (e) {
      // ignore
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentWrap}>
        <LlmLibraryTab
          onUsePrompt={handleUsePrompt}
          onNavigateToPost={handleNavigateToPost}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrap: {
    flex: 1,
  },
})
