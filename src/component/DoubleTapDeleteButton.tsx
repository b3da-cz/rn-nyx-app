import React, { useEffect, useRef, useState } from 'react'
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { useTheme } from '../lib'

type Props = {
  onDelete: () => void
  label?: string
  confirmLabel?: string
  iconSize?: number
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  timeoutMs?: number
  disabled?: boolean
  // borderless, transparent variant; the confirm state tints icon + label instead of the background
  flat?: boolean
}

export const DoubleTapDeleteButton: React.FC<Props> = ({
  onDelete,
  label = '',
  iconSize = 14,
  style,
  textStyle,
  timeoutMs = 3500,
  disabled = false,
  flat = false,
}) => {
  const { colors } = useTheme()
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handlePress = () => {
    if (disabled) return

    if (!confirming) {
      setConfirming(true)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        setConfirming(false)
      }, timeoutMs)
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      setConfirming(false)
      onDelete()
    }
  }

  const dangerColor = '#DC2626'
  const textToShow = confirming ? '' : label
  const fgColor = confirming ? (flat ? dangerColor : '#FFFFFF') : colors.faded

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        flat
          ? { backgroundColor: colors.transparent, borderWidth: 0 }
          : {
              backgroundColor: confirming ? dangerColor : colors.background,
              borderColor: confirming ? dangerColor : colors.disabled,
            },
        style,
      ]}>
      <Icon
        name={confirming ? 'check' : 'trash-2'}
        size={iconSize}
        color={fgColor}
      />
      {!!textToShow && (
        <Text
          style={[
            styles.text,
            { color: fgColor },
            textStyle,
          ]}>
          {textToShow}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
})
