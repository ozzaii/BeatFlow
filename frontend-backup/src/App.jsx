import { ChakraProvider, Box } from '@chakra-ui/react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import theme from './theme'
import Layout from './components/Layout'
import Home from './pages/Home'
import Studio from './pages/Studio'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Box minH="100vh">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/studio" element={<Studio />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  )
}

export default App
