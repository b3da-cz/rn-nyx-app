import React, { Component, createContext } from 'react'
import { Nyx } from './Nyx'
import { MainContext } from './MainContext'

export const UnreadContext = createContext({
  posts: 0,
  messages: 0,
})

type Props = {
  children: Component | Element | any
}
type State = {
  unreadMessages: number
  unreadPosts: number
}
export class UnreadContextProvider extends Component<Props> {
  static contextType = MainContext
  state: State
  nyx?: Nyx
  contextObserver?: any
  constructor(props) {
    super(props)
    this.state = {
      unreadMessages: 0,
      unreadPosts: 0,
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    if (this.nyx?.api?.onContextUpdate) {
      this.contextObserver = this.nyx.api.onContextUpdate.subscribe()
      this.contextObserver.then(nc => {
        this.setState({ unreadMessages: nc?.user?.mail_unread || 0, unreadPosts: nc?.user?.notifications_unread || 0 })
      })
    }
  }

  componentWillUnmount() {
    if (this.contextObserver) {
      this.contextObserver.unsubscribe()
      this.contextObserver = undefined
    }
  }

  render() {
    const { unreadMessages, unreadPosts } = this.state
    return (
      <UnreadContext.Provider value={{ messages: unreadMessages, posts: unreadPosts }}>
        {this.props.children}
      </UnreadContext.Provider>
    )
  }
}
