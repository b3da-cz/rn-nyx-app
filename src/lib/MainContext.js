import { createContext } from 'react'

export const MainContext = createContext({
  nyx: null,
  config: null,
  filters: [],
  blockedUsers: [],
  theme: {},
  refs: {},
})
