import { extendTheme } from '@chakra-ui/react'

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

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
}

const styles = {
  global: {
    body: {
      bg: 'black',
      color: 'whiteAlpha.900',
      fontFamily: 'BlenderPro, system-ui, sans-serif',
    },
  },
}

const components = {
  Button: {
    baseStyle: {
      borderRadius: 'md',
      _hover: {
        transform: 'scale(1.05)',
        boxShadow: '0 0 20px cyan',
      },
      _active: {
        transform: 'scale(0.95)',
      },
      transition: 'all 0.2s',
    },
  },
  Heading: {
    baseStyle: {
      fontFamily: 'BlenderPro, system-ui, sans-serif',
      letterSpacing: '0.1em',
    },
  },
  Text: {
    baseStyle: {
      fontFamily: 'BlenderPro, system-ui, sans-serif',
    },
  },
}

const fonts = {
  heading: 'BlenderPro, system-ui, sans-serif',
  body: 'BlenderPro, system-ui, sans-serif',
}

const theme = extendTheme({
  config,
  colors,
  styles,
  components,
  fonts,
})

export default theme 