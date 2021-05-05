import { createContext } from 'react'

export const Context = createContext({
  nyx: null,
  config: null,
  theme: 'dark',
  refs: {},
})
