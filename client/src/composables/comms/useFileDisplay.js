// client/src/composables/comms/useFileDisplay.js
import { computed } from 'vue'

export function useFileDisplay(filesRef) {
  // Sort files by creation date (newest first)
  const sortedFiles = computed(() => {
    return [...filesRef.value].sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
      return bTime - aTime
    })
  })

  // Group files by base name to find latest versions
  const fileVersionGroups = computed(() => {
    const groups = {}
    
    filesRef.value.forEach(file => {
      // Skip external links
      if (file.type === 'external_link') return
      
      // Use originalName if available, otherwise use name
      const baseName = file.originalName || file.name || ''
      if (!baseName) return
      
      if (!groups[baseName]) {
        groups[baseName] = []
      }
      groups[baseName].push(file)
    })
    
    // Sort each group by version (descending)
    Object.keys(groups).forEach(baseName => {
      groups[baseName].sort((a, b) => {
        const versionA = a.version || 1
        const versionB = b.version || 1
        return versionB - versionA
      })
    })
    
    return groups
  })

  // Filter files by type
  const filesByType = computed(() => {
    const projectFiles = filesRef.value.filter(f => f.type !== 'external_link')
    const projectLinks = filesRef.value.filter(f => f.type === 'external_link')
    
    return {
      files: projectFiles,
      links: projectLinks,
      hasLinks: projectLinks.length > 0
    }
  })

  // Get all versions of a specific file
  const getFileVersions = (fileName) => {
    return fileVersionGroups.value[fileName] || []
  }

  // Check if a file is the only version
  const isSingleVersion = (file) => {
    if (file.type === 'external_link') return false
    
    const baseName = file.name || file.originalName || ''
    const group = fileVersionGroups.value[baseName]
    
    return group && group.length === 1
  }

  // Check if file has multiple versions
  const hasMultipleVersions = (file) => {
    if (file.type === 'external_link') return false
    
    const baseName = file.name || file.originalName || ''
    const group = fileVersionGroups.value[baseName]
    
    return group && group.length > 1
  }

  return {
    sortedFiles,
    fileVersionGroups,
    filesByType,
    getFileVersions,
    isSingleVersion,
    hasMultipleVersions
  }
}