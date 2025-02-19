import { extendTheme } from '@chakra-ui/react'

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

// Enhanced color palette with vibrant neons and rich darks
const colors = {
  brand: {
    50: '#E6FFFF',
    100: '#B3FFFF',
    200: '#80FFFF',
    300: '#4DFFFF',
    400: '#1AFFFF',
    500: '#00FFFF',
    600: '#00CCCC',
    700: '#009999',
    800: '#006666',
    900: '#003333',
  },
  accent: {
    50: '#FFE6FF',
    100: '#FFB3FF',
    200: '#FF80FF',
    300: '#FF4DFF',
    400: '#FF1AFF',
    500: '#FF00FF',
    600: '#CC00CC',
    700: '#990099',
    800: '#660066',
    900: '#330033',
  },
  neon: {
    blue: '#00f3ff',
    purple: '#8a2be2',
    pink: '#ff00ff',
    green: '#00ff9f',
    yellow: '#ffff00',
  },
  dark: {
    100: '#1a1a1a',
    200: '#2d2d2d',
    300: '#3d3d3d',
    400: '#4d4d4d',
    500: '#5c5c5c',
  }
}

// Enhanced global styles
const styles = {
  global: {
    body: {
      bg: 'black',
      color: 'whiteAlpha.900',
      fontFamily: 'BlenderPro, system-ui, sans-serif',
      lineHeight: 'tall',
      transitionProperty: 'all',
      transitionDuration: '0.2s',
    },
    '*::selection': {
      bg: 'brand.500',
      color: 'black',
    },
    '::-webkit-scrollbar': {
      width: '10px',
      height: '10px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'dark.100',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'brand.500',
      borderRadius: 'full',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: 'brand.400',
    },
  },
}

// Enhanced component styles
const components = {
  Button: {
    baseStyle: {
      borderRadius: 'lg',
      fontWeight: 'bold',
      _hover: {
        transform: 'scale(1.05)',
        boxShadow: '0 0 20px var(--chakra-colors-brand-500)',
      },
      _active: {
        transform: 'scale(0.95)',
      },
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'black',
        _hover: {
          bg: 'brand.400',
        },
      },
      outline: {
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: {
          bg: 'transparent',
          borderColor: 'brand.400',
          color: 'brand.400',
        },
      },
      ghost: {
        _hover: {
          bg: 'whiteAlpha.100',
        },
      },
      neon: {
        bg: 'transparent',
        color: 'brand.500',
        boxShadow: '0 0 10px var(--chakra-colors-brand-500)',
        _hover: {
          boxShadow: '0 0 20px var(--chakra-colors-brand-400)',
          color: 'brand.400',
        },
      },
    },
  },
  Heading: {
    baseStyle: {
      fontFamily: 'BlenderPro, system-ui, sans-serif',
      letterSpacing: '0.1em',
      fontWeight: 'bold',
      textShadow: '0 0 10px var(--chakra-colors-brand-500)',
    },
  },
  Text: {
    baseStyle: {
      fontFamily: 'BlenderPro, system-ui, sans-serif',
    },
  },
  Input: {
    variants: {
      filled: {
        field: {
          bg: 'dark.200',
          _hover: {
            bg: 'dark.300',
          },
          _focus: {
            bg: 'dark.300',
            borderColor: 'brand.500',
          },
        },
      },
    },
    defaultProps: {
      variant: 'filled',
    },
  },
  Select: {
    variants: {
      filled: {
        field: {
          bg: 'dark.200',
          _hover: {
            bg: 'dark.300',
          },
          _focus: {
            bg: 'dark.300',
            borderColor: 'brand.500',
          },
        },
      },
    },
    defaultProps: {
      variant: 'filled',
    },
  },
  Slider: {
    baseStyle: {
      thumb: {
        bg: 'brand.500',
        _hover: {
          boxShadow: '0 0 10px var(--chakra-colors-brand-500)',
        },
      },
      track: {
        bg: 'dark.300',
      },
      filledTrack: {
        bg: 'brand.500',
      },
    },
  },
  Menu: {
    baseStyle: {
      list: {
        bg: 'dark.200',
        borderColor: 'brand.500',
        boxShadow: '0 0 10px var(--chakra-colors-brand-500)',
      },
      item: {
        _hover: {
          bg: 'dark.300',
        },
      },
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        bg: 'dark.200',
        borderColor: 'brand.500',
        boxShadow: '0 0 20px var(--chakra-colors-brand-500)',
      },
    },
  },
  Tooltip: {
    baseStyle: {
      bg: 'brand.500',
      color: 'black',
      boxShadow: '0 0 10px var(--chakra-colors-brand-500)',
    },
  },
}

const fonts = {
  heading: 'BlenderPro, system-ui, sans-serif',
  body: 'BlenderPro, system-ui, sans-serif',
}

// Custom transition presets
const transition = {
  property: {
    common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
    colors: 'background-color, border-color, color, fill, stroke',
    dimensions: 'width, height',
    position: 'left, right, top, bottom',
    background: 'background-color, background-image, background-position',
  },
  easing: {
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  duration: {
    'ultra-fast': '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    'ultra-slow': '500ms',
  },
}

const theme = extendTheme({
  config,
  colors,
  styles,
  components,
  fonts,
  transition,
})

export default theme 