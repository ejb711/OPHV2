<!-- client/src/components/comms/search/PresetFilters.vue -->
<template>
  <div>
    <h4 class="text-body-1 mb-3">Preset Filters</h4>
    
    <v-row>
      <v-col
        v-for="preset in presetFilters"
        :key="preset.id"
        cols="12"
        sm="6"
      >
        <v-card
          variant="outlined"
          density="comfortable"
          @click="$emit('apply', preset.id)"
          class="cursor-pointer"
          :class="{ 'border-primary': false }"
        >
          <v-card-text class="pa-3">
            <div class="d-flex align-center">
              <v-icon
                :icon="preset.icon"
                color="primary"
                size="small"
                class="mr-2"
              />
              <div class="flex-grow-1">
                <div class="font-weight-medium">{{ preset.name }}</div>
                <div class="text-caption text-grey-darken-1">
                  {{ preset.description }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { useProjectFilters } from '@/composables/comms/useProjectFilters'

// Emits
defineEmits(['apply'])

// Composables
const { presetFilters } = useProjectFilters()
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
  transition: all 0.2s ease;
}

.cursor-pointer:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px !important;
}
</style>