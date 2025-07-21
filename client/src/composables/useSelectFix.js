// client/src/composables/useSelectFix.js
import { onMounted, onUpdated, nextTick } from 'vue'

/**
 * Composable to fix v-select dropdown text overlay issues
 * Use this in components that have v-select with custom selection templates
 */
export function useSelectFix() {
  const fixSelectDisplay = async () => {
    await nextTick()
    
    // Find all v-select elements with custom chip selections
    const selects = document.querySelectorAll('.v-select')
    
    selects.forEach(select => {
      const chips = select.querySelectorAll('.v-select__selection .v-chip')
      
      if (chips.length > 0) {
        // Hide any duplicate text elements
        const selectionTexts = select.querySelectorAll('.v-select__selection-text')
        selectionTexts.forEach(text => {
          // Only hide if there's a chip present
          const parent = text.closest('.v-select__selection')
          if (parent && parent.querySelector('.v-chip')) {
            text.style.display = 'none'
          }
        })
        
        // Also hide any direct text nodes that might be causing issues
        const fieldInput = select.querySelector('.v-field__input')
        if (fieldInput) {
          const walker = document.createTreeWalker(
            fieldInput,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
              }
            }
          )
          
          let node
          while (node = walker.nextNode()) {
            // Hide text nodes that match role names
            if (node.parentElement && !node.parentElement.classList.contains('v-chip__content')) {
              const text = node.nodeValue.trim().toLowerCase()
              if (['user', 'admin', 'owner', 'viewer', 'pending'].includes(text)) {
                node.nodeValue = ''
              }
            }
          }
        }
      }
    })
  }
  
  // Run fix on mount and updates
  onMounted(() => {
    fixSelectDisplay()
  })
  
  onUpdated(() => {
    fixSelectDisplay()
  })
  
  return {
    fixSelectDisplay
  }
}