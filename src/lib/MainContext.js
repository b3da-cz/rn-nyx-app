import { createContext } from 'react'

export const MainContext = createContext({
  nyx: null,
  config: null,
  theme: 'dark',
  refs: {},
})
