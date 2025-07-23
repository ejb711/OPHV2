<!-- client/src/components/comms/files/LinkManager.vue -->
<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-link</v-icon>
      External Links
    </v-card-title>
    
    <v-card-text>
      <!-- Add link form -->
      <div v-if="showForm">
        <div class="mb-3">
          <div class="text-subtitle-2 mb-2">Link Title <span class="text-error">*</span></div>
          <v-text-field
            v-model="newLink.title"
            placeholder="e.g., Project Documentation"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            hide-details="auto"
          />
        </div>
        
        <div class="mb-3">
          <div class="text-subtitle-2 mb-2">URL <span class="text-error">*</span></div>
          <v-text-field
            v-model="newLink.url"
            placeholder="https://example.com/document"
            variant="outlined"
            density="compact"
            :rules="[rules.required, rules.url]"
            hide-details="auto"
          />
        </div>
        
        <div class="mb-3">
          <div class="text-subtitle-2 mb-2">Description (optional)</div>
          <v-textarea
            v-model="newLink.description"
            placeholder="Brief description of this link"
            variant="outlined"
            density="compact"
            rows="2"
            hide-details
          />
        </div>
        
        <div class="d-flex justify-end ga-2">
          <v-btn
            variant="text"
            @click="cancelAdd"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="adding"
            :disabled="!isFormValid"
            @click="addLink"
          >
            Add Link
          </v-btn>
        </div>
      </div>
      
      <!-- Add button -->
      <v-btn
        v-else
        color="primary"
        variant="tonal"
        prepend-icon="mdi-plus"
        block
        @click="showForm = true"
      >
        Add External Link
      </v-btn>
      
      <!-- Links list -->
      <div v-if="links.length > 0" class="mt-4">
        <v-divider class="mb-3" />
        
        <div class="text-subtitle-2 mb-2">
          {{ links.length }} External {{ links.length === 1 ? 'Link' : 'Links' }}
        </div>
        
        <v-list density="compact">
          <v-list-item
            v-for="link in links"
            :key="link.id"
            :href="link.url"
            target="_blank"
            class="mb-2"
          >
            <template v-slot:prepend>
              <v-icon color="primary">mdi-link-variant</v-icon>
            </template>
            
            <v-list-item-title>
              {{ link.title || link.displayName }}
            </v-list-item-title>
            
            <v-list-item-subtitle v-if="link.description">
              {{ link.description }}
            </v-list-item-subtitle>
            
            <v-list-item-subtitle>
              <span class="text-caption">
                {{ formatUrl(link.url) }}
              </span>
            </v-list-item-subtitle>
            
            <template v-slot:append v-if="canEdit">
              <div class="d-flex ga-1">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click.stop.prevent="startEdit(link)"
                >
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  @click.stop.prevent="confirmDelete(link)"
                >
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
    
    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Link?</v-card-title>
        <v-card-text>
          Are you sure you want to delete the link "{{ linkToDelete?.title }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            variant="elevated"
            @click="deleteLink"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Edit dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>Edit Link</v-card-title>
        <v-card-text>
          <div class="mb-3">
            <div class="text-subtitle-2 mb-2">Link Title <span class="text-error">*</span></div>
            <v-text-field
              v-model="editingLink.title"
              placeholder="e.g., Project Documentation"
              variant="outlined"
              density="compact"
              :rules="[rules.required]"
              hide-details="auto"
            />
          </div>
          
          <div class="mb-3">
            <div class="text-subtitle-2 mb-2">URL <span class="text-error">*</span></div>
            <v-text-field
              v-model="editingLink.url"
              placeholder="https://example.com/document"
              variant="outlined"
              density="compact"
              :rules="[rules.required, rules.url]"
              hide-details="auto"
            />
          </div>
          
          <div>
            <div class="text-subtitle-2 mb-2">Description (optional)</div>
            <v-textarea
              v-model="editingLink.description"
              placeholder="Brief description of this link"
              variant="outlined"
              density="compact"
              rows="2"
              hide-details
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelEdit">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            :disabled="!isEditFormValid"
            @click="saveEdit"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  links: {
    type: Array,
    default: () => []
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['add', 'edit', 'delete'])

// State
const showForm = ref(false)
const adding = ref(false)
const deleteDialog = ref(false)
const editDialog = ref(false)
const linkToDelete = ref(null)
const editingLink = ref({})

const newLink = ref({
  title: '',
  url: '',
  description: ''
})

// Validation rules
const rules = {
  required: value => !!value || 'Required',
  url: value => {
    try {
      new URL(value)
      return true
    } catch {
      return 'Must be a valid URL'
    }
  }
}

// Computed
const isFormValid = computed(() => {
  return newLink.value.title && newLink.value.url && rules.url(newLink.value.url) === true
})

const isEditFormValid = computed(() => {
  return editingLink.value.title && editingLink.value.url && rules.url(editingLink.value.url) === true
})

// Methods
async function addLink() {
  if (!isFormValid.value) return
  
  adding.value = true
  try {
    await emit('add', {
      title: newLink.value.title,
      url: newLink.value.url,
      description: newLink.value.description
    })
    
    // Reset form
    newLink.value = {
      title: '',
      url: '',
      description: ''
    }
    showForm.value = false
  } catch (error) {
    console.error('Error adding link:', error)
  } finally {
    adding.value = false
  }
}

function cancelAdd() {
  newLink.value = {
    title: '',
    url: '',
    description: ''
  }
  showForm.value = false
}

function confirmDelete(link) {
  linkToDelete.value = link
  deleteDialog.value = true
}

async function deleteLink() {
  if (!linkToDelete.value) return
  
  try {
    await emit('delete', linkToDelete.value.id)
    deleteDialog.value = false
    linkToDelete.value = null
  } catch (error) {
    console.error('Error deleting link:', error)
  }
}

function startEdit(link) {
  editingLink.value = {
    id: link.id,
    title: link.title || link.displayName,
    url: link.url,
    description: link.description || ''
  }
  editDialog.value = true
}

function cancelEdit() {
  editingLink.value = {}
  editDialog.value = false
}

async function saveEdit() {
  if (!isEditFormValid.value) return
  
  try {
    await emit('edit', editingLink.value.id, {
      title: editingLink.value.title,
      url: editingLink.value.url,
      description: editingLink.value.description
    })
    editDialog.value = false
    editingLink.value = {}
  } catch (error) {
    console.error('Error updating link:', error)
  }
}

function formatUrl(url) {
  try {
    const u = new URL(url)
    return u.hostname + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url
  }
}
</script>

<style scoped>
/* Ensure proper spacing for form fields */
.text-subtitle-2 {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

/* Fix list item hover state */
.v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

/* Ensure links are properly styled */
.v-list-item[href] {
  cursor: pointer;
  text-decoration: none;
}

/* Error state indicator */
.text-error {
  color: #d32f2f;
}
</style>