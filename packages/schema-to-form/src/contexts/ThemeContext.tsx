import { defaultTheme, FormTheme } from "../types";
import React, { createContext, useContext } from "react";

const ThemeContext = createContext<FormTheme>(defaultTheme);

const deepMerge = (target: any, source: any) => {
  if (!source) return target;
  const output = { ...target };

  Object.keys(source).forEach((key) => {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  });

  return output;
};

export const ThemeProvider: React.FC<{
  theme?: Partial<FormTheme>;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  const mergedTheme = React.useMemo(
    () => deepMerge(defaultTheme, theme),
    [theme]
  );
  
  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useFormTheme = () => useContext(ThemeContext);
