// src/ThemeProviderWrapper.jsx
import React, { useMemo, useState, createContext, useContext } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

// 🌈 Create context to share color mode
const ColorModeContext = createContext();
export const useColorMode = () => useContext(ColorModeContext);

export default function ThemeProviderWrapper({ children }) {
  // Load saved theme mode from localStorage or default to light
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');

  // ✅ Fix: update dependencies so component re-renders properly
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const newMode = prev === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode] // ← this was missing before
  );

  // Define light and dark theme styles
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? { background: { default: '#fafafa', paper: '#fff' } }
            : { background: { default: '#121212', paper: '#1e1e1e' } }),
        },
        typography: { fontFamily: "'Inter', sans-serif" },
        shape: { borderRadius: 10 },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

// 🌗 Fixed Theme Toggle Button (tooltip + icon update instantly)
export function ThemeToggleButton() {
  const { mode, toggleColorMode } = useColorMode();

  const tooltipTitle =
    mode === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme';

  return (
    <Tooltip
      key={mode} // ensures tooltip updates
      title={tooltipTitle}
      arrow
      placement="left"
    >
      <IconButton
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1500,
          bgcolor: 'background.paper',
          borderRadius: '50%',
          boxShadow: 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: 'action.hover',
            transform: 'rotate(20deg)',
          },
        }}
        color="inherit"
        onClick={toggleColorMode}
      >
        {/* ✅ Icon updates instantly now */}
        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
}
