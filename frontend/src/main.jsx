import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, Spinner, Center } from '@chakra-ui/react'
import { HashRouter as Router } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'
import App from './App.jsx'
import theme from './theme'
import './index.css'

const Root = () => (
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ChakraProvider>
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
