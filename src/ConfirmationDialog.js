import { Alert } from 'react-native'

export const confirm = async (title, message) => {
  return new Promise(resolve => {
    Alert.alert(title, message, [
      {
        text: 'Cancel',
        onPress: () => resolve(false),
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: () => resolve(true),
      },
    ])
  })
}
