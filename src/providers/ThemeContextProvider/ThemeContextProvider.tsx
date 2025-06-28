import { ReactNode } from 'react'
import { ThemeContext } from 'src/contexts'

export const ThemeContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  const theme = 'dark'
  const toggleTheme = () => {
    // No-op since we only support dark mode
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`theme-${theme}`}>{children}</div>
    </ThemeContext.Provider>
  )
}
