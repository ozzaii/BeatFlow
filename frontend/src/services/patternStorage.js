import { nanoid } from 'nanoid'

const STORAGE_KEY = 'beatflow_patterns'

export const savePattern = (pattern, name = '', kit = '909') => {
  try {
    const patterns = loadPatterns()
    const id = nanoid()
    const timestamp = new Date().toISOString()
    
    const newPattern = {
      id,
      name: name || `Pattern ${patterns.length + 1}`,
      kit,
      pattern,
      created: timestamp,
      modified: timestamp,
    }
    
    patterns.push(newPattern)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns))
    
    return newPattern
  } catch (error) {
    console.error('Failed to save pattern:', error)
    return null
  }
}

export const loadPatterns = () => {
  try {
    const patterns = localStorage.getItem(STORAGE_KEY)
    return patterns ? JSON.parse(patterns) : []
  } catch (error) {
    console.error('Failed to load patterns:', error)
    return []
  }
}

export const updatePattern = (id, updates) => {
  try {
    const patterns = loadPatterns()
    const index = patterns.findIndex(p => p.id === id)
    
    if (index === -1) return null
    
    patterns[index] = {
      ...patterns[index],
      ...updates,
      modified: new Date().toISOString(),
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns))
    return patterns[index]
  } catch (error) {
    console.error('Failed to update pattern:', error)
    return null
  }
}

export const deletePattern = (id) => {
  try {
    const patterns = loadPatterns()
    const filtered = patterns.filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Failed to delete pattern:', error)
    return false
  }
}

export const exportPattern = (pattern) => {
  try {
    const data = JSON.stringify(pattern, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${pattern.name || 'pattern'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('Failed to export pattern:', error)
    return false
  }
}

export const importPattern = async (file) => {
  try {
    const text = await file.text()
    const pattern = JSON.parse(text)
    
    // Validate pattern structure
    if (!pattern.pattern || !pattern.kit) {
      throw new Error('Invalid pattern format')
    }
    
    return pattern
  } catch (error) {
    console.error('Failed to import pattern:', error)
    return null
  }
}

export default {
  savePattern,
  loadPatterns,
  updatePattern,
  deletePattern,
  exportPattern,
  importPattern,
} 