import React from 'react';
import { defaultListTheme } from '../types/defaultListTheme';
import { ListTheme } from "../types/ListSchema";

const ThemeContext = React.createContext<ListTheme>(defaultListTheme);

export const useListTheme = () => React.useContext(ThemeContext);

export const ListThemeProvider: React.FC<{
  theme?: Partial<ListTheme>;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  const mergedTheme = React.useMemo(
    () => ({ ...defaultListTheme, ...theme }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};