<!-- client/src/views/TestDropdown.vue -->
<template>
  <v-container class="py-8">
    <h1 class="text-h4 mb-6">Dropdown Label Test Page</h1>
    
    <!-- Test 1: Default Vuetify Select -->
    <v-card class="mb-6">
      <v-card-title>Test 1: Default Vuetify Select (Problem)</v-card-title>
      <v-card-text>
        <v-select
          v-model="test1Value"
          :items="roleItems"
          label="Filter by Role"
          variant="outlined"
        />
      </v-card-text>
    </v-card>

    <!-- Test 2: External Label (LoginView Pattern) -->
    <v-card class="mb-6">
      <v-card-title>Test 2: External Label Pattern</v-card-title>
      <v-card-text>
        <div class="field-wrapper">
          <label class="external-label">Filter by Role</label>
          <v-select
            v-model="test2Value"
            :items="roleItems"
            variant="outlined"
            placeholder="Select a role"
            hide-details
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Test 3: No Label + Placeholder -->
    <v-card class="mb-6">
      <v-card-title>Test 3: No Label, Just Placeholder</v-card-title>
      <v-card-text>
        <v-select
          v-model="test3Value"
          :items="roleItems"
          variant="outlined"
          placeholder="Filter by Role"
          hide-details
        />
      </v-card-text>
    </v-card>

    <!-- Test 4: External Label with CSS Fix -->
    <v-card class="mb-6">
      <v-card-title>Test 4: External Label + CSS Fix</v-card-title>
      <v-card-text>
        <div class="test4-wrapper">
          <label class="test4-label">Filter by Role</label>
          <v-select
            v-model="test4Value"
            :items="roleItems"
            variant="outlined"
            placeholder="Select a role"
            hide-details
            class="test4-select"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Test 5: Solo Variant -->
    <v-card class="mb-6">
      <v-card-title>Test 5: Solo Variant with External Label</v-card-title>
      <v-card-text>
        <div class="field-wrapper">
          <label class="external-label">Filter by Role</label>
          <v-select
            v-model="test5Value"
            :items="roleItems"
            variant="solo"
            placeholder="Select a role"
            hide-details
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Test 6: Filled Variant -->
    <v-card class="mb-6">
      <v-card-title>Test 6: Filled Variant with External Label</v-card-title>
      <v-card-text>
        <div class="field-wrapper">
          <label class="external-label">Filter by Role</label>
          <v-select
            v-model="test6Value"
            :items="roleItems"
            variant="filled"
            placeholder="Select a role"
            hide-details
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Current Values Display -->
    <v-card>
      <v-card-title>Selected Values</v-card-title>
      <v-card-text>
        <pre>{{ selectedValues }}</pre>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

// Test values
const test1Value = ref('owner')
const test2Value = ref('owner')
const test3Value = ref('owner')
const test4Value = ref('owner')
const test5Value = ref('owner')
const test6Value = ref('owner')

// Role items
const roleItems = [
  { value: 'all', title: 'All Roles' },
  { value: 'owner', title: 'Owner' },
  { value: 'admin', title: 'Admin' },
  { value: 'user', title: 'User' },
  { value: 'viewer', title: 'Viewer' },
  { value: 'pending', title: 'Pending' }
]

// Computed values display
const selectedValues = computed(() => ({
  test1: test1Value.value,
  test2: test2Value.value,
  test3: test3Value.value,
  test4: test4Value.value,
  test5: test5Value.value,
  test6: test6Value.value
}))
</script>

<style scoped>
/* External label styles (matching LoginView) */
.field-wrapper {
  width: 100%;
}

.external-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #003057;
  margin-bottom: 8px;
  font-family: 'Cambria', Georgia, serif;
}

/* Test 4 specific styles with more aggressive fixes */
.test4-wrapper {
  width: 100%;
  position: relative;
}

.test4-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #003057;
  margin-bottom: 12px;
  font-family: 'Cambria', Georgia, serif;
  position: relative;
  z-index: 10;
  background: white;
  padding: 0 4px;
}

/* Aggressive CSS to hide Vuetify labels in test 4 */
.test4-select :deep(.v-field__label),
.test4-select :deep(.v-label),
.test4-select :deep(.v-field__field label),
.test4-select :deep(.v-input__details),
.test4-select :deep(.v-messages) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

/* Hide selection text overlay for all tests */
:deep(.v-select .v-field__input .v-select__selection-text) {
  display: none !important;
}

/* Ensure field positioning */
:deep(.v-field) {
  margin-top: 0 !important;
}

/* Card spacing */
.v-card {
  margin-bottom: 24px;
}

pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-family: monospace;
}
</style>

<style>
/* Global fixes that might be needed */
.test4-select .v-field__label {
  display: none !important;
}
</style>