import React, { Component, ReactNode } from 'react'
import { Text, View } from 'react-native'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    console.warn('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#d32f2f' }}>Chyba při načítání obsahu</Text>
          </View>
        )
      )
    }
    return this.props.children
  }
}
