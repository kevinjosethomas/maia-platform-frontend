import React from 'react'

import { Theme } from 'src/types'

interface IThemeContext {
  theme: Theme
  toggleTheme: VoidFunction
}

export const ThemeContext = React.createContext<IThemeContext>({
  theme: 'dark',
  toggleTheme: () => {
    // No-op since we only support dark mode
  },
})
