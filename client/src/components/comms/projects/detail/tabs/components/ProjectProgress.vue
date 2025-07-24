<!-- client/src/components/comms/projects/detail/tabs/components/ProjectProgress.vue -->
<template>
  <div class="mb-6">
    <div class="d-flex align-center justify-space-between mb-2">
      <label class="field-label">Project Progress</label>
      <span class="text-caption text-grey-darken-1">
        {{ completedStages }} of {{ totalStages }} stages completed
      </span>
    </div>
    
    <v-progress-linear
      :model-value="progressPercentage"
      height="24"
      rounded
      color="primary"
    >
      <template v-slot:default="{ value }">
        <strong>{{ Math.ceil(value) }}%</strong>
      </template>
    </v-progress-linear>
  </div>
</template>

<script setup>
// Props
defineProps({
  completedStages: {
    type: Number,
    required: true
  },
  totalStages: {
    type: Number,
    required: true
  },
  progressPercentage: {
    type: Number,
    required: true
  }
})
</script>

<style scoped>
.field-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}
</style>