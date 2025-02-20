export const components = {
  Button: {
    variants: {
      neon: {
        bg: 'transparent',
        color: 'brand.500',
        border: '1px solid',
        borderColor: 'brand.500',
        _hover: {
          bg: 'rgba(0, 255, 255, 0.1)',
          boxShadow: '0 0 20px var(--chakra-colors-brand-500)',
          transform: 'scale(1.05)',
        },
        _active: {
          bg: 'rgba(0, 255, 255, 0.2)',
        },
      },
    },
  },
  Input: {
    variants: {
      neon: {
        field: {
          bg: 'dark.200',
          border: '1px solid',
          borderColor: 'brand.500',
          color: 'whiteAlpha.900',
          _hover: {
            borderColor: 'brand.400',
            boxShadow: '0 0 10px var(--chakra-colors-brand-500)',
          },
          _focus: {
            borderColor: 'brand.300',
            boxShadow: '0 0 15px var(--chakra-colors-brand-500)',
          },
        },
      },
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        bg: 'dark.200',
        borderColor: 'brand.500',
        borderWidth: '1px',
        boxShadow: '0 0 30px var(--chakra-colors-brand-500)',
      },
    },
  },
} 