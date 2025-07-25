<!-- client/src/components/comms/dashboard/CommsDashboardToolbar.vue -->
<!-- Toolbar with export and date controls (~100 lines) -->
<!-- Props: analytics, exporting, visible-projects-count -->
<!-- Events: export-csv, export-pdf, update-date-range -->
<template>
  <div>
    <!-- Export Menu -->
    <div class="d-flex justify-end mb-4">
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            prepend-icon="mdi-export"
            :disabled="visibleProjectsCount === 0"
            :loading="exporting"
          >
            Export
            <v-icon end>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="$emit('export-csv')">
            <v-list-item-title>
              <v-icon start>mdi-file-excel</v-icon>
              Export to CSV
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('export-pdf')">
            <v-list-item-title>
              <v-icon start>mdi-file-pdf-box</v-icon>
              Export to PDF
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- Analytics Date Range Filter -->
    <v-row v-if="analytics?.dateRange" class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          :model-value="analytics.dateRange.value.start"
          label="Start Date"
          type="date"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="handleStartDateChange"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          :model-value="analytics.dateRange.value.end"
          label="End Date"
          type="date"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="handleEndDateChange"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  analytics: Object,
  exporting: Boolean,
  visibleProjectsCount: {
    type: Number,
    default: 0
  }
})

// Emit
const emit = defineEmits([
  'export-csv',
  'export-pdf',
  'update-date-range'
])

// Methods
function handleStartDateChange(value) {
  emit('update-date-range', {
    start: value,
    end: props.analytics?.dateRange?.value?.end
  })
}

function handleEndDateChange(value) {
  emit('update-date-range', {
    start: props.analytics?.dateRange?.value?.start,
    end: value
  })
}
</script>