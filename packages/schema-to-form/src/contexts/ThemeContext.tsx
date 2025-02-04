import { defaultTheme, FormTheme } from "../types";
import React, { createContext, useContext } from "react";

const ThemeContext = createContext<FormTheme>(defaultTheme);

export const ThemeProvider: React.FC<{
  theme?: Partial<FormTheme>;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  const mergedTheme = React.useMemo(
    () => ({
      ...defaultTheme,
      ...theme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useFormTheme = () => useContext(ThemeContext);
