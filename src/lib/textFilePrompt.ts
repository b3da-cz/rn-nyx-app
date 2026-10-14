import { Alert, Platform, ToastAndroid } from 'react-native'
import { t } from './Strings'
import { textFileKind } from './textFile'
import { downloadTextFile, openFileViewer, openRemoteTextFile } from './textFileTransfer'
import { TEXT_FILE_MAX_BYTES } from './textFile'
import ReactNativeBlobUtil from 'react-native-blob-util'

type FileApi = {
  fileRequestHeaders: (url: string) => Record<string, string>
}

export function promptTextFile(url: string, label: string | undefined, api: FileApi): boolean {
  if (Platform.OS !== 'android' || !textFileKind(url, label)) {
    return false
  }
  Alert.alert(label || url, undefined, [
    { text: t('cancel'), style: 'cancel' },
    { text: t('file.download'), onPress: () => downloadTextFile(url, label, api) },
    { text: t('file.open'), onPress: () => openRemoteTextFile(url, label, api) },
  ])
  return true
}

export async function openLocalTextFile(uri: string, name: string, tooBig?: boolean) {
  if (tooBig) {
    ToastAndroid.show(t('file.tooBig'), ToastAndroid.LONG)
    return
  }
  try {
    const path = uri.startsWith('file://') ? uri.slice('file://'.length) : uri
    const stat = await ReactNativeBlobUtil.fs.stat(path)
    if (Number(stat.size) > TEXT_FILE_MAX_BYTES) {
      ToastAndroid.show(t('file.tooBig'), ToastAndroid.LONG)
      return
    }
    openFileViewer(path, name, true)
  } catch (e: any) {
    ToastAndroid.show(e?.message || t('file.failed'), ToastAndroid.LONG)
  }
}
