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
        <v-text-field
          v-model="newLink.title"
          label="Link Title"
          placeholder="e.g., Project Documentation"
          variant="outlined"
          density="compact"
          :rules="[rules.required]"
          class="mb-3"
        />
        
        <v-text-field
          v-model="newLink.url"
          label="URL"
          placeholder="https://example.com/document"
          variant="outlined"
          density="compact"
          :rules="[rules.required, rules.url]"
          class="mb-3"
        />
        
        <v-textarea
          v-model="newLink.description"
          label="Description (optional)"
          placeholder="Brief description of this link"
          variant="outlined"
          density="compact"
          rows="2"
          class="mb-3"
        />
        
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
        
        <v-list density="compact" class="rounded">
          <template v-for="(link, index) in links" :key="link.id">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="blue">mdi-link</v-icon>
              </template>
              
              <v-list-item-title>
                <a 
                  :href="link.url" 
                  target="_blank"
                  class="text-decoration-none"
                  @click.stop
                >
                  {{ link.displayName || link.name }}
                  <v-icon size="x-small" class="ml-1">mdi-open-in-new</v-icon>
                </a>
              </v-list-item-title>
              
              <v-list-item-subtitle v-if="link.description">
                {{ link.description }}
              </v-list-item-subtitle>
              
              <v-list-item-subtitle>
                Added {{ formatDate(link.createdAt) }}
                <span v-if="link.createdByEmail">by {{ link.createdByEmail }}</span>
              </v-list-item-subtitle>
              
              <template v-slot:append v-if="canEdit">
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      v-bind="props"
                    >
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  
                  <v-list density="compact">
                    <v-list-item @click="editLink(link)">
                      <template v-slot:prepend>
                        <v-icon>mdi-pencil</v-icon>
                      </template>
                      <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>
                    
                    <v-list-item @click="copyLink(link.url)">
                      <template v-slot:prepend>
                        <v-icon>mdi-content-copy</v-icon>
                      </template>
                      <v-list-item-title>Copy URL</v-list-item-title>
                    </v-list-item>
                    
                    <v-divider />
                    
                    <v-list-item @click="removeLink(link)" class="text-error">
                      <template v-slot:prepend>
                        <v-icon color="error">mdi-delete</v-icon>
                      </template>
                      <v-list-item-title>Remove</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-list-item>
            
            <v-divider v-if="index < links.length - 1" />
          </template>
        </v-list>
      </div>
    </v-card-text>
    
    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>Edit Link</v-card-title>
        
        <v-card-text v-if="editingLink">
          <v-text-field
            v-model="editingLink.title"
            label="Link Title"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            class="mb-3"
          />
          
          <v-text-field
            v-model="editingLink.url"
            label="URL"
            variant="outlined"
            density="compact"
            :rules="[rules.required, rules.url]"
            class="mb-3"
          />
          
          <v-textarea
            v-model="editingLink.description"
            label="Description"
            variant="outlined"
            density="compact"
            rows="2"
          />
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            :loading="saving"
            @click="saveEdit"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Success snackbar -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="3000"
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'

// Props & Emits
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

const emit = defineEmits(['add', 'edit', 'delete'])

// State
const showForm = ref(false)
const adding = ref(false)
const newLink = ref({
  title: '',
  url: '',
  description: ''
})

const editDialog = ref(false)
const editingLink = ref(null)
const saving = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Validation rules
const rules = {
  required: v => !!v || 'Required',
  url: v => {
    try {
      new URL(v)
      return true
    } catch {
      return 'Invalid URL'
    }
  }
}

// Computed
const isFormValid = computed(() => {
  return newLink.value.title && newLink.value.url && rules.url(newLink.value.url) === true
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
    
    showSnackbar('Link added successfully')
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

function editLink(link) {
  editingLink.value = {
    id: link.id,
    title: link.displayName || link.name,
    url: link.url,
    description: link.description || ''
  }
  editDialog.value = true
}

async function saveEdit() {
  if (!editingLink.value) return
  
  saving.value = true
  
  try {
    await emit('edit', editingLink.value.id, {
      displayName: editingLink.value.title,
      url: editingLink.value.url,
      description: editingLink.value.description
    })
    
    editDialog.value = false
    editingLink.value = null
    
    showSnackbar('Link updated successfully')
  } finally {
    saving.value = false
  }
}

async function removeLink(link) {
  if (confirm(`Remove "${link.displayName || link.name}"?`)) {
    await emit('delete', link.id)
    showSnackbar('Link removed')
  }
}

function copyLink(url) {
  navigator.clipboard.writeText(url)
  showSnackbar('URL copied to clipboard')
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown date'
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    return 'Unknown date'
  }
}

function showSnackbar(text, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>