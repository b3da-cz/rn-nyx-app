import React, { Component, createContext } from 'react'
import { Nyx, MainContext } from '../lib'

export const UnreadContext = createContext({
  posts: 0,
  messages: 0,
})

type Props = {
  nyx: Nyx,
  children: Component,
}
export class UnreadContextProvider extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.state = {
      unreadMessages: 0,
      unreadPosts: 0,
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.nyx.onContextUpdate = nc => {
      this.setState({ unreadMessages: nc?.user?.mail_unread || 0, unreadPosts: nc?.user?.notifications_unread || 0 })
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
