import { extendTheme } from '@chakra-ui/react'
import { colors } from './colors'
import { components } from './components'
import {
  config,
  styles,
  fonts,
  fontSizes,
  breakpoints,
  space,
} from './foundations'

const theme = extendTheme({
  config,
  colors,
  components,
  styles,
  fonts,
  fontSizes,
  breakpoints,
  space,
})

export default theme 