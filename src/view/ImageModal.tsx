import React, { useMemo, useRef } from 'react'
import { StyleSheet, ToastAndroid, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import ImageViewer from 'react-native-image-zoom-viewer'
import RNFetchBlob from 'react-native-blob-util'
import Share from 'react-native-share'
import { LoaderComponent } from '../component'
import { t } from '../lib'

type Props = {
  isShowing?: boolean
  images: any[]
  imgIndex?: number
  animationType?: 'fade' | 'none' | 'slide' | undefined
  onExit: Function
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

export const ImageModal = ({ isShowing = true, images, imgIndex = 0, onExit }: Props) => {
  const sharing = useRef(false)
  const urls = useMemo(
    () =>
      (images || [])
        .map(img => ({ ...img, url: img?.url || img?.src }))
        .filter(img => !!img.url),
    [images],
  )
  const index = urls.length ? Math.min(Math.max(0, imgIndex || 0), urls.length - 1) : 0

  const urlAt = (i?: number) => {
    if (!urls.length) {
      return undefined
    }
    const safe = Math.min(Math.max(0, i || 0), urls.length - 1)
    return urls[safe]?.url
  }

  const share = async (url?: string) => {
    if (!url || sharing.current) {
      return
    }
    sharing.current = true
    try {
      const href = url.startsWith('//') ? `https:${url}` : url
      const hinted = mimeFromUrl(href)
      // fileCache + gzip Content-Length mismatch throws "Download interrupted."
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
        onSave={img => share(img)}
        loadingRender={() => <LoaderComponent />}
        menuContext={{ saveToLocal: t('share'), cancel: t('cancel') }}
        renderHeader={i => (
          <View style={styles.header} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.headerBtn}
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => share(urlAt(i))}>
              <Icon name="share" size={24} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => onExit()}>
              <Icon name="x" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 99,
    elevation: 99,
    flexDirection: 'row',
    paddingTop: 8,
    paddingRight: 8,
  },
  headerBtn: {
    padding: 10,
  },
})
