import { createTheme } from '@mui/material/styles';

const fontFamily = '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif';

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#141414', contrastText: '#ffffff' },
        secondary: { main: '#b5562e' },
        success: { main: '#2f6b4f' },
        background: { default: '#faf9f7', paper: '#ffffff' },
        text: { primary: '#141414', secondary: '#5f5c57' },
        divider: 'rgba(20, 20, 20, 0.1)',
      },
    },
    dark: {
      palette: {
        primary: { main: '#f4f1ea', contrastText: '#141414' },
        secondary: { main: '#e0855d' },
        success: { main: '#6fbf95' },
        background: { default: '#121212', paper: '#1b1b1b' },
        text: { primary: '#f4f1ea', secondary: '#b3ada3' },
        divider: 'rgba(244, 241, 234, 0.12)',
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily,
    h1: { fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 650, letterSpacing: '-0.015em' },
    h5: { fontWeight: 650, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    overline: { fontWeight: 600, letterSpacing: '0.12em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 20 },
        sizeLarge: { paddingBlock: 12, paddingInline: 28, fontSize: '1rem' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: ({ theme: t }) => ({ border: `1px solid ${t.vars.palette.divider}` }) },
    },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiLink: { defaultProps: { underline: 'hover' } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } },
  },
});

export default theme;
