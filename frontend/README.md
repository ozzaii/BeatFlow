# BeatFlow Frontend

## 🎵 Overview
BeatFlow is an AI-powered music creation studio built with React and Chakra UI.

## 🚀 Quick Start
```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Deploy to GitHub Pages
pnpm deploy
```

## 📝 Deployment Guide

### Prerequisites
1. Node.js 18+ installed
2. pnpm installed globally
3. GitHub repository set up
4. GitHub Pages enabled in repository settings

### Step-by-Step Deployment
1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Build the Project**
   ```bash
   pnpm build
   ```

3. **Deploy to GitHub Pages**
   ```bash
   pnpm deploy
   ```

### Configuration Files

1. **vite.config.js**
   ```javascript
   export default defineConfig({
     plugins: [react()],
     base: '/BeatFlow/'
   })
   ```

2. **package.json**
   - Required scripts:
     ```json
     {
       "scripts": {
         "predeploy": "pnpm run build",
         "deploy": "gh-pages -d dist"
       }
     }
     ```
   - Required dependencies:
     ```json
     {
       "dependencies": {
         "@chakra-ui/react": "^2.8.2",
         "react": "^18.2.0",
         "react-router-dom": "^6.22.0"
       }
     }
     ```

3. **Router Configuration**
   - Use HashRouter instead of BrowserRouter
   ```javascript
   import { HashRouter as Router } from 'react-router-dom'
   ```

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

1. **White Screen on GitHub Pages**
   - Ensure base URL is set correctly in vite.config.js
   - Use HashRouter instead of BrowserRouter
   - Check if all assets use relative paths

2. **Build Failures**
   - Use compatible dependency versions
   - Use pnpm for better dependency resolution
   - Clear node_modules and reinstall dependencies

3. **Dependency Version Issues**
   - Stick to these tested versions:
     ```json
     {
       "@chakra-ui/react": "^2.8.2",
       "react": "^18.2.0",
       "react-dom": "^18.2.0",
       "react-router-dom": "^6.22.0"
     }
     ```

4. **Vite Configuration Issues**
   - Keep vite.config.js minimal
   - Ensure all imports are available
   - Use correct plugin configurations

### Deployment Checklist
- [ ] All dependencies installed
- [ ] Build succeeds locally
- [ ] HashRouter implemented
- [ ] Base URL configured
- [ ] GitHub Pages enabled
- [ ] Custom domain configured (if applicable)

## 📚 Tech Stack
- React 18
- Vite 5
- Chakra UI 2.8
- React Router 6
- pnpm (package manager)

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
