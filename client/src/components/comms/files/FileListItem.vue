<!-- client/src/components/comms/files/FileListItem.vue -->
<template>
  <v-list-item
    :class="{ 'bg-grey-lighten-5': file.type === 'external_link' }"
  >
    <template v-slot:prepend>
      <v-avatar :color="file.type === 'external_link' ? 'blue' : 'primary'" variant="tonal">
        <v-icon>{{ fileIcon }}</v-icon>
      </v-avatar>
    </template>
    
    <v-list-item-title>
      {{ file.displayName || file.name }}
      <!-- Version badges -->
      <FileVersionBadge
        :file="file"
        :is-latest="isLatestVersion"
        :is-single="isSingleVersion"
        :has-multiple="hasMultipleVersions"
      />
    </v-list-item-title>
    
    <v-list-item-subtitle>
      <span v-if="file.type === 'external_link'">
        External Link
      </span>
      <span v-else>
        {{ formattedSize }} • 
        {{ formattedDate }}
      </span>
      <span v-if="file.createdByEmail" class="ml-2">
        by {{ file.createdByEmail }}
      </span>
    </v-list-item-subtitle>
    
    <template v-if="file.description">
      <v-list-item-subtitle class="mt-1">
        {{ file.description }}
      </v-list-item-subtitle>
    </template>
    
    <template v-if="file.tags && file.tags.length > 0">
      <div class="mt-1">
        <v-chip
          v-for="tag in file.tags"
          :key="tag"
          size="x-small"
          variant="tonal"
          class="mr-1"
        >
          {{ tag }}
        </v-chip>
      </div>
    </template>
    
    <template v-slot:append>
      <div class="d-flex align-center">
        <!-- View/Download button -->
        <v-btn
          v-if="file.type === 'external_link'"
          icon
          size="small"
          variant="text"
          :href="file.url"
          target="_blank"
          @click.stop
        >
          <v-icon>mdi-open-in-new</v-icon>
          <v-tooltip activator="parent" location="top">
            Open link
          </v-tooltip>
        </v-btn>
        <v-btn
          v-else
          icon
          size="small"
          variant="text"
          :href="file.downloadURL"
          target="_blank"
          @click.stop
        >
          <v-icon>mdi-download</v-icon>
          <v-tooltip activator="parent" location="top">
            Download
          </v-tooltip>
        </v-btn>
        
        <!-- Version history button -->
        <v-btn
          v-if="hasMultipleVersions"
          icon
          size="small"
          variant="text"
          @click="$emit('show-versions', file.name)"
        >
          <v-icon>mdi-history</v-icon>
          <v-tooltip activator="parent" location="top">
            Version history
          </v-tooltip>
        </v-btn>
        
        <!-- Actions menu -->
        <v-menu v-if="canEdit" location="start">
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
            <v-list-item @click="$emit('edit', file)">
              <template v-slot:prepend>
                <v-icon>mdi-pencil</v-icon>
              </template>
              <v-list-item-title>Edit details</v-list-item-title>
            </v-list-item>
            
            <v-list-item 
              @click="$emit('delete', file)"
              class="text-error"
            >
              <template v-slot:prepend>
                <v-icon>mdi-delete</v-icon>
              </template>
              <v-list-item-title>Delete</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </template>
  </v-list-item>
</template>

<script setup>
import { computed } from 'vue'
import { getFileIcon, formatFileSize, formatDate } from '@/utils/fileUtils'
import FileVersionBadge from './FileVersionBadge.vue'

// Props
const props = defineProps({
  file: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  fileVersionGroups: {
    type: Object,
    default: () => ({})
  }
})

// Emits
defineEmits(['edit', 'delete', 'show-versions'])

// Computed
const fileIcon = computed(() => getFileIcon(props.file))
const formattedSize = computed(() => formatFileSize(props.file.size))
const formattedDate = computed(() => formatDate(props.file.createdAt))

const isLatestVersion = computed(() => {
  if (props.file.type === 'external_link') return false
  
  const baseName = props.file.name || props.file.originalName || ''
  const group = props.fileVersionGroups[baseName]
  
  // If it's the only file, it's not "latest", it's "current"
  if (!group || group.length <= 1) return false
  
  const fileVersion = props.file.version || 1
  const maxVersion = Math.max(...group.map(f => f.version || 1))
  
  return fileVersion === maxVersion && group.length > 1
})

const isSingleVersion = computed(() => {
  if (props.file.type === 'external_link') return false
  
  const baseName = props.file.name || props.file.originalName || ''
  const group = props.fileVersionGroups[baseName]
  
  // It's a single version if it's the only file with this name
  // This should be true even if the file has version > 1
  return group && group.length === 1
})

const hasMultipleVersions = computed(() => {
  if (props.file.type === 'external_link') return false
  
  const baseName = props.file.name || props.file.originalName || ''
  const group = props.fileVersionGroups[baseName]
  
  return group && group.length > 1
})
</script>

<style scoped>
/* Ensure consistent list item spacing */
.v-list-item {
  min-height: 72px;
}

/* Better visual hierarchy for file information */
.v-list-item-subtitle {
  opacity: 0.8;
}
</style>