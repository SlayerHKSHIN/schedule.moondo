export const theme = {
  colors: {
    // 메인 베이지 팔레트
    beige: {
      light: '#FFF8F3',
      main: '#F5E6D3',
      dark: '#E8D5C4',
      darker: '#D4B5A0'
    },
    // 파스텔톤 액센트 색상
    pastel: {
      peach: '#FFE5CC',
      lavender: '#E8E3F5',
      mint: '#D4F1EE',
      rose: '#FFE4E6',
      sage: '#E1EDD9',
      sky: '#E3F2FD'
    },
    // 기능적 색상
    primary: '#D4B5A0',
    secondary: '#FFE5CC',
    success: '#A8D5BA',
    warning: '#FFD6A5',
    error: '#FFB5B5',
    // 텍스트 색상
    text: {
      primary: '#5C4033',
      secondary: '#8B7355',
      light: '#A89585',
      disabled: '#C4B5A5'
    },
    // 배경 색상
    background: {
      default: '#FFFAF6',
      paper: '#FFFFFF',
      card: '#FFF8F3',
      hover: '#FAF0E6'
    },
    // 보더 색상
    border: {
      light: '#F0E6DC',
      main: '#E8D5C4',
      dark: '#D4B5A0'
    }
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    headingFontFamily: "'Playfair Display', serif",
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      '@media (min-width: 768px)': {
        fontSize: '2.5rem'
      }
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      '@media (min-width: 768px)': {
        fontSize: '2rem'
      }
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
      '@media (min-width: 768px)': {
        fontSize: '1.5rem'
      }
    },
    body: {
      fontSize: '1rem',
      lineHeight: 1.6
    },
    small: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  borderRadius: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    round: '50%'
  },
  shadows: {
    sm: '0 2px 4px rgba(92, 64, 51, 0.05)',
    md: '0 4px 8px rgba(92, 64, 51, 0.08)',
    lg: '0 8px 16px rgba(92, 64, 51, 0.1)',
    xl: '0 16px 32px rgba(92, 64, 51, 0.12)'
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out'
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px'
  }
};