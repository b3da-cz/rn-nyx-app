import { Alert } from 'react-native'
import { t } from '../lib'

export const confirm = async (title, message) => {
  return new Promise(resolve => {
    Alert.alert(title, message, [
      {
        text: t('cancel'),
        onPress: () => resolve(false),
        style: 'cancel',
      },
      {
        text: t('ok'),
        onPress: () => resolve(true),
      },
    ])
  })
}
