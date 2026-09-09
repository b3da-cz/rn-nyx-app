import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import FA from 'react-native-vector-icons/FontAwesome'
import ImageViewer from 'react-native-image-zoom-viewer'
import RNFetchBlob from 'react-native-blob-util'
import Share from 'react-native-share'
import { LoaderComponent } from '../component'
import { MainContext, fetchImageByteLength, formatImageSizeKb, rememberLoadedImageUrl, t } from '../lib'

type Props = {
  isShowing?: boolean
  images: any[]
  imgIndex?: number
  animationType?: 'fade' | 'none' | 'slide' | undefined
  onExit: Function
  onIndexChange?: (index: number) => void
  onRated?: (updatedPost: any) => void
}

const mimeFromUrl = (url: string) => {
  const path = (url || '').split('?')[0].split('#')[0]
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'png':
      return { type: 'image/png', ext: 'png' }
    case 'gif':
      return { type: 'image/gif', ext: 'gif' }
    case 'webp':
      return { type: 'image/webp', ext: 'webp' }
    default:
      return { type: 'image/jpeg', ext: 'jpg' }
  }
}

const isPositiveRating = (rating?: string | null) => !!rating && `${rating}`.includes('positive')
const isNegativeRating = (rating?: string | null) => !!rating && `${rating}`.includes('negative')

const ratingsFromImages = (images: any[] = []) => {
  const next: Record<string, string | undefined> = {}
  for (const img of images) {
    if (img?.postId != null && img.myRating != null) {
      next[String(img.postId)] = img.myRating
    }
  }
  return next
}

export const ImageModal = ({ isShowing = true, images, imgIndex = 0, onExit, onIndexChange, onRated }: Props) => {
  const { nyx } = useContext(MainContext) as any
  const sharing = useRef(false)
  const ratingLock = useRef(false)
  const urls = useMemo(
    () =>
      (images || [])
        .map(img => {
          const url = img?.url || img?.src
          if (!url) {
            return null
          }
          const next = { ...img, url }
          delete next.width
          delete next.height
          return next
        })
        .filter(img => !!img),
    [images],
  )
  const index = urls.length ? Math.min(Math.max(0, imgIndex || 0), urls.length - 1) : 0
  const [currentIndex, setCurrentIndex] = useState(index)
  const [ratingsByPost, setRatingsByPost] = useState<Record<string, string | undefined>>(() =>
    ratingsFromImages(images),
  )
  const [sizeLabel, setSizeLabel] = useState(() => formatImageSizeKb(urls[index]?.byteLength))

  useEffect(() => {
    const img = urls[currentIndex]
    rememberLoadedImageUrl(img?.url || img?.src)
    const known = formatImageSizeKb(img?.byteLength)
    if (known) {
      setSizeLabel(known)
      return
    }
    let cancelled = false
    setSizeLabel(null)
    fetchImageByteLength(img?.url || img?.src).then(bytes => {
      if (!cancelled) {
        setSizeLabel(formatImageSizeKb(bytes))
      }
    })
    return () => {
      cancelled = true
    }
  }, [currentIndex, urls])

  const setIndex = (i?: number) => {
    const next = urls.length ? Math.min(Math.max(0, i || 0), urls.length - 1) : 0
    setCurrentIndex(next)
    onIndexChange?.(next)
  }

  const imgAt = (i?: number) => {
    if (!urls.length) {
      return undefined
    }
    return urls[Math.min(Math.max(0, i || 0), urls.length - 1)]
  }

  const ratingOf = (img: any) => {
    if (!img) {
      return undefined
    }
    const key = img.postId != null ? String(img.postId) : ''
    if (key && Object.prototype.hasOwnProperty.call(ratingsByPost, key)) {
      return ratingsByPost[key]
    }
    return img.myRating
  }

  const rateImage = async (img: any, vote: 'positive' | 'negative') => {
    if (!nyx || !img?.postId || img.canBeRated === false || ratingLock.current) {
      return
    }
    const rating = ratingOf(img) as string | undefined
    ratingLock.current = true
    try {
      const post = {
        id: img.postId,
        discussion_id: img.discussionId,
        my_rating: rating,
      }
      const nextVote = rating?.includes(vote) ? 'remove' : vote
      const res = await nyx.ratePost(post, nextVote)
      if (res?.error) {
        return
      }
      setRatingsByPost(prev => ({ ...prev, [String(img.postId)]: res?.my_rating ?? '' }))
      onRated?.(res)
    } catch (e) {
      console.warn(e)
    } finally {
      ratingLock.current = false
    }
  }

  const share = async (url?: string) => {
    if (!url || sharing.current) {
      return
    }
    sharing.current = true
    try {
      const href = url.startsWith('//') ? `https:${url}` : url
      const hinted = mimeFromUrl(href)
      const resp = await RNFetchBlob.fetch('GET', href, { Accept: 'image/*' })
      const status = resp.info()?.status
      if (status < 200 || status >= 300) {
        throw new Error(`download ${status}`)
      }
      const headerType = `${resp.info()?.headers?.['Content-Type'] || resp.info()?.headers?.['content-type'] || ''}`
      const type = headerType.split(';')[0].trim() || hinted.type
      const ext = type.includes('png')
        ? 'png'
        : type.includes('gif')
        ? 'gif'
        : type.includes('webp')
        ? 'webp'
        : hinted.ext
      const dest = `${RNFetchBlob.fs.dirs.CacheDir}/nnn-share-${Date.now()}.${ext}`
      await RNFetchBlob.fs.writeFile(dest, resp.base64(), 'base64')
      await Share.open({
        url: dest.startsWith('file://') ? dest : `file://${dest}`,
        type,
        filename: `nnn.${ext}`,
        failOnCancel: false,
      })
    } catch (e: any) {
      const msg = e?.message || `${e}`
      if (!/user did not share|not share|cancel/i.test(msg)) {
        ToastAndroid.show(msg, ToastAndroid.LONG)
      }
    } finally {
      sharing.current = false
    }
  }

  if (!isShowing) {
    return null
  }

  return (
    <View style={styles.root}>
      <ImageViewer
        key={`${index}-${urls.length}-${urls[index]?.url || ''}`}
        imageUrls={urls}
        index={index}
        doubleClickInterval={300}
        onChange={i => setIndex(i)}
        onSave={img => share(img)}
        loadingRender={() => <LoaderComponent />}
        menuContext={{ saveToLocal: t('share'), cancel: t('cancel') }}
        renderHeader={i => {
          const shown = imgAt(i)
          const rating = ratingOf(shown)
          const showRate = !!nyx && shown?.postId != null && shown?.canBeRated !== false
          return (
            <View style={styles.header} pointerEvents="box-none">
              {!!sizeLabel && (
                <View style={styles.sizeBadge} pointerEvents="none">
                  <Text style={[styles.sizeText, sizeLabel.overMb && styles.sizeTextOverMb]}>{sizeLabel.text}</Text>
                </View>
              )}
              {showRate && (
                <TouchableOpacity
                  style={styles.headerBtn}
                  accessibilityRole="button"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => rateImage(shown, 'positive')}
                >
                  {isPositiveRating(rating) ? (
                    <FA name="thumbs-up" size={22} color="green" />
                  ) : (
                    <Icon name="thumbs-up" size={22} color="green" />
                  )}
                </TouchableOpacity>
              )}
              {showRate && (
                <TouchableOpacity
                  style={styles.headerBtn}
                  accessibilityRole="button"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => rateImage(shown, 'negative')}
                >
                  {isNegativeRating(rating) ? (
                    <FA name="thumbs-down" size={22} color="red" />
                  ) : (
                    <Icon name="thumbs-down" size={22} color="red" />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.headerBtn}
                accessibilityRole="button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => share(shown?.url)}
              >
                <Icon name="share" size={24} color="#ccc" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerBtn}
                accessibilityRole="button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => onExit()}
              >
                <Icon name="x" size={24} color="#ccc" />
              </TouchableOpacity>
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    elevation: 99,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    paddingRight: 8,
    alignItems: 'center',
  },
  sizeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  sizeText: {
    color: '#ccc',
    fontSize: 13,
  },
  sizeTextOverMb: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  headerBtn: {
    padding: 10,
  },
})
