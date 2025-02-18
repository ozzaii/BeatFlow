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
}

const fonts = {
  heading: 'Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, sans-serif',
}

const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
      color: props.colorMode === 'dark' ? 'white' : 'gray.900',
    },
  }),
}

const components = {
  Button: {
    defaultProps: {
      colorScheme: 'brand',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorMode === 'dark' ? 'brand.500' : 'brand.400',
        color: 'gray.900',
        _hover: {
          bg: props.colorMode === 'dark' ? 'brand.400' : 'brand.500',
        },
      }),
    },
  },
}

const theme = extendTheme({ 
  config, 
  colors, 
  fonts, 
  styles, 
  components,
})

export default theme 