// client/src/composables/useSelectFix.js
import { onMounted, onUpdated, nextTick } from 'vue'

/**
 * Composable to fix Vuetify 3 v-select text overlay issue
 * when using custom selection templates
 * 
 * Usage:
 * import { useSelectFix } from '@/composables/useSelectFix'
 * 
 * setup() {
 *   useSelectFix()
 *   // ... rest of your setup code
 * }
 */
export function useSelectFix() {
  const fixSelectOverlay = async () => {
    await nextTick()
    
    // Find all v-select components with custom selection templates
    const selects = document.querySelectorAll('.v-select')
    
    selects.forEach(select => {
      // Check if this select has a custom chip selection
      const hasCustomChip = select.querySelector('.v-field__input .v-chip')
      
      if (hasCustomChip) {
        // Find and hide the default selection text
        const selectionTexts = select.querySelectorAll('.v-select__selection-text')
        selectionTexts.forEach(text => {
          text.style.display = 'none'
        })
        
        // Also hide any direct text nodes that might be rendered
        const fieldInput = select.querySelector('.v-field__input')
        if (fieldInput) {
          const childNodes = fieldInput.childNodes
          childNodes.forEach(node => {
            // If it's a text node with content, hide it
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              const span = document.createElement('span')
              span.style.display = 'none'
              span.textContent = node.textContent
              node.parentNode.replaceChild(span, node)
            }
          })
        }
      }
    })
  }
  
  // Run fix on mount and updates
  onMounted(() => {
    fixSelectOverlay()
    
    // Also run after a short delay to catch any late-rendering selects
    setTimeout(fixSelectOverlay, 100)
  })
  
  onUpdated(() => {
    fixSelectOverlay()
  })
  
  // Return the fix function so it can be called manually if needed
  return {
    fixSelectOverlay
  }
}