import { Platform, ToastAndroid } from 'react-native'
import ReactNativeBlobUtil from 'react-native-blob-util'
import Share from 'react-native-share'
import { t } from './Strings'
import { fileNameFromUrl, mimeForTextFile, TEXT_FILE_MAX_BYTES, TextFileExt, textFileKind } from './textFile'
import { navigationRef } from './navigationRef'

type FileApi = {
  fileRequestHeaders: (url: string) => Record<string, string>
}

const cachePath = (name: string) => {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file.txt'
  return `${ReactNativeBlobUtil.fs.dirs.CacheDir}/nnn-file-${Date.now()}-${safe}`
}

const localPath = (uri: string) => (uri.startsWith('file://') ? uri.slice('file://'.length) : uri)

export async function readCachedText(uri: string): Promise<string> {
  return ReactNativeBlobUtil.fs.readFile(localPath(uri), 'utf8')
}

async function fetchToCache(url: string, headers: Record<string, string>, name: string) {
  const path = cachePath(name)
  // blob-util reports "Download interrupted" when gzip changes the body size
  // against Content-Length. fetch follows redirects and decodes the body.
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`download ${res.status}`)
  }
  const body = await res.text()
  await ReactNativeBlobUtil.fs.writeFile(path, body, 'utf8')
  const bytes = typeof Blob === 'function' ? new Blob([body]).size : body.length
  return { path, bytes }
}

async function publishDownload(path: string, name: string, mime: string) {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 29) {
    await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
      { name, parentFolder: '', mimeType: mime } as any,
      'Download',
      path,
    )
    ToastAndroid.show(t('file.saved'), ToastAndroid.SHORT)
    return
  }
  await Share.open({
    url: path.startsWith('file://') ? path : `file://${path}`,
    type: mime,
    filename: name,
    failOnCancel: false,
  })
}

export function openFileViewer(path: string, name: string, external = false) {
  const params = { path, name, external }
  let tries = 0
  const go = () => {
    tries += 1
    if (!navigationRef.isReady()) {
      return false
    }
    navigationRef.navigate('file', params)
    return true
  }
  if (go()) {
    return
  }
  const timer = setInterval(() => {
    if (go() || tries >= 20) {
      clearInterval(timer)
    }
  }, 250)
}

export async function downloadTextFile(url: string, label: string | undefined, api: FileApi) {
  const ext = textFileKind(url, label) || 'txt'
  const name = fileNameFromUrl(url, label)
  try {
    const headers = api.fileRequestHeaders(url)
    const { path } = await fetchToCache(url, headers, name)
    await publishDownload(path, name, mimeForTextFile(ext as TextFileExt))
  } catch (e: any) {
    ToastAndroid.show(e?.message || t('file.failed'), ToastAndroid.LONG)
  }
}

export async function openRemoteTextFile(url: string, label: string | undefined, api: FileApi) {
  const ext = textFileKind(url, label)
  if (!ext) {
    return
  }
  const name = fileNameFromUrl(url, label)
  try {
    const headers = api.fileRequestHeaders(url)
    const { path, bytes } = await fetchToCache(url, headers, name)
    if (bytes > TEXT_FILE_MAX_BYTES) {
      ToastAndroid.show(t('file.tooBig'), ToastAndroid.LONG)
      await publishDownload(path, name, mimeForTextFile(ext))
      return
    }
    openFileViewer(path, name)
  } catch (e: any) {
    ToastAndroid.show(e?.message || t('file.failed'), ToastAndroid.LONG)
  }
}


