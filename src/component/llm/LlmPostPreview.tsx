import React, { useContext, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { Text } from 'react-native-paper'
import { PostComponent } from '../PostComponent'
import {
  galleryImagesFromPosts,
  getDistinctPosts,
  MainContext,
  preparePosts,
  revealImageInPosts,
  t,
  toGalleryImages,
  useTheme,
} from '../../lib'

type Props = {
  discussionId: number | string
  postId: string
  onClose: () => void
  onShowReplies: (discussionId: number | string, postId: string) => void
  onOpenPost: (discussionId: number | string, postId?: number | string) => void
  onOpenImages: (images: any[], imgIndex: number) => void
}

const postsForPreview = (res: any, postId: string): any[] => {
  const list = Array.isArray(res) ? res : Array.isArray(res?.posts) ? res.posts : res?.id != null ? [res] : []
  return list.filter(post => post && `${post.id}` === `${postId}`)
}

export const LlmPostPreview: React.FC<Props> = ({
  discussionId,
  postId,
  onClose,
  onShowReplies,
  onOpenPost,
  onOpenImages,
}) => {
  const context = useContext(MainContext)
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const { height } = useWindowDimensions()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const nyx = context?.nyx

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await nyx?.api.getDiscussion(`${discussionId}/id/${postId}`)
        const replies = getDistinctPosts(postsForPreview(res, postId), [])
        const fontSize = context?.theme?.metrics?.fontSizes?.p
        const prepared = await preparePosts(
          replies,
          [],
          true,
          fontSize,
          context?.config?.imageDownloadMaxKb,
        )
        if (!cancelled) {
          setPosts(prepared || [])
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || t('llm.errorLoadingOlder'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [discussionId, postId])

  const openImage = async (image: any, list?: any[]) => {
    const next = await revealImageInPosts(posts.slice(), image, context?.theme?.metrics?.fontSizes?.p)
    setPosts(next)
    const source = list?.length ? list : galleryImagesFromPosts(next)
    const { images, imgIndex } = toGalleryImages(image, source)
    onOpenImages(images, imgIndex)
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 8, justifyContent: 'center' }}>
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.backdrop }} onPress={onClose} />
      <View
        style={{
          marginHorizontal: blocks.medium,
          maxHeight: height * 0.86,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: height * 0.86 }}>
          {loading && <ActivityIndicator color={colors.primary} style={{ margin: blocks.large }} />}
          {!!error && (
            <Text style={{ color: colors.error, fontSize: fontSizes.p, padding: blocks.medium }}>{error}</Text>
          )}
          {!loading && !error && posts.length === 0 && (
            <Text style={{ color: colors.faded, fontSize: fontSizes.p, padding: blocks.medium }}>{t('llm.postPreviewEmpty')}</Text>
          )}
          {posts.map(post => (
            <PostComponent
              key={post.uuid || post.id}
              post={post}
              nyx={nyx}
              headerSwipeable
              isHeaderInteractive
              onBodyPress={onClose}
              onDiscussionDetailShow={(nextDiscussionId, nextPostId) => {
                onClose()
                onOpenPost(nextDiscussionId, nextPostId)
              }}
              onRepliesShow={(nextDiscussionId, nextPostId) => {
                if (nextPostId != null) {
                  onShowReplies(nextDiscussionId || discussionId, `${nextPostId}`)
                }
              }}
              onImage={(image, list) => {
                void openImage(image, list)
              }}
              onDelete={id => setPosts(current => current.filter(item => `${item.id}` !== `${id}`))}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  )
}
