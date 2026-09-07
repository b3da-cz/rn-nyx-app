import { useEffect } from 'react'
import { BackHandler, Platform } from 'react-native'
import {
  CommonActions,
  StackActions,
  type NavigationContainerRef,
  type NavigationState,
  type PartialState,
} from '@react-navigation/native'

type NavState = NavigationState | PartialState<NavigationState>

const goBackInState = (nav: NavigationContainerRef<any>, state?: NavState | null): boolean => {
  if (!state?.routes?.length) {
    return false
  }
  const index = state.index ?? 0
  const route = state.routes[index]
  if (route?.state && goBackInState(nav, route.state)) {
    return true
  }
  if (!state.key) {
    return false
  }
  if (state.type !== 'tab' && index > 0) {
    nav.dispatch({ ...StackActions.pop(1), target: state.key })
    return true
  }
  const history = 'history' in state && Array.isArray(state.history) ? state.history : []
  if (state.type === 'tab' && history.length > 1) {
    nav.dispatch({ ...CommonActions.goBack(), target: state.key })
    return true
  }
  return false
}

type Props = {
  navigationRef: NavigationContainerRef<any>
}

// ViewPager2 (tab swipe) breaks NavigationContainer's focus chain, so Android
// back finishes the activity. Handle back ourselves, deepest stack first,
// then tab visit history. Register after NavigationContainer so we run first.
export const NestedBackHandler = ({ navigationRef }: Props) => {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return
    }
    let subscription: { remove: () => void } | undefined
    const timer = setTimeout(() => {
      subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!navigationRef.isReady()) {
          return false
        }
        return goBackInState(navigationRef, navigationRef.getRootState())
      })
    }, 0)
    return () => {
      clearTimeout(timer)
      subscription?.remove()
    }
  }, [navigationRef])
  return null
}
