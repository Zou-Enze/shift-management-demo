import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#3B3377',
      dark: '#180D54',
      light: '#524B90',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F2E300',
      dark: '#676000',
      light: '#F5E60B',
      contrastText: '#1F1C00',
    },
    error: {
      main: '#BA1A1A',
      light: '#FFDAD6',
      dark: '#93000A',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#E89B0F',
    },
    background: {
      default: '#FBF9F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1B1C1C',
      secondary: '#474550',
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily:
      '"Hanken Grotesk", "Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", "Noto Sans JP", sans-serif',
      fontSize: '48px',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Montserrat", "Noto Sans JP", sans-serif',
      fontSize: '32px',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: '"Montserrat", "Noto Sans JP", sans-serif',
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontFamily: '"Montserrat", "Noto Sans JP", sans-serif',
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: { fontSize: '16px', lineHeight: 1.6 },
    body2: { fontSize: '14px', lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 4, textTransform: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #E0E0E0',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});
