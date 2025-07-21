<!-- client/src/components/admin/user-form/ProfileDetailsStep.vue -->
<template>
  <div class="form-container">
    <v-container fluid>
      <v-row>
        <!-- Phone Number -->
        <v-col cols="12" md="6">
          <div class="modern-field-group">
            <label class="modern-label">Phone Number</label>
            <v-text-field
              v-model="formattedPhone"
              variant="solo-filled"
              flat
              density="comfortable"
              placeholder="(555) 123-4567"
              prepend-inner-icon="mdi-phone-outline"
              :rules="validationRules.phoneRules"
              class="modern-input"
            />
          </div>
        </v-col>

        <!-- Region -->
        <v-col cols="12" md="6">
          <div class="modern-field-group">
            <label class="modern-label">Region</label>
            <v-select
              v-model="modelValue.region"
              :items="regionOptions"
              variant="solo-filled"
              flat
              density="comfortable"
              placeholder="Select region"
              prepend-inner-icon="mdi-map-marker-outline"
              @update:model-value="updateField('region', $event)"
              class="modern-input"
            />
          </div>
        </v-col>

        <!-- Department -->
        <v-col cols="12" md="6">
          <div class="modern-field-group">
            <label class="modern-label">Department</label>
            <v-text-field
              v-model="modelValue.department"
              variant="solo-filled"
              flat
              density="comfortable"
              placeholder="e.g., Public Health"
              prepend-inner-icon="mdi-office-building-outline"
              @update:model-value="updateField('department', $event)"
              class="modern-input"
            />
          </div>
        </v-col>

        <!-- Job Title -->
        <v-col cols="12" md="6">
          <div class="modern-field-group">
            <label class="modern-label">Job Title</label>
            <v-text-field
              v-model="modelValue.title"
              variant="solo-filled"
              flat
              density="comfortable"
              placeholder="e.g., Health Specialist"
              prepend-inner-icon="mdi-briefcase-outline"
              @update:model-value="updateField('title', $event)"
              class="modern-input"
            />
          </div>
        </v-col>

        <!-- Location -->
        <v-col cols="12">
          <div class="modern-field-group">
            <label class="modern-label">Location</label>
            <v-text-field
              v-model="modelValue.location"
              variant="solo-filled"
              flat
              density="comfortable"
              placeholder="City, State"
              prepend-inner-icon="mdi-map-outline"
              @update:model-value="updateField('location', $event)"
              class="modern-input"
            />
          </div>
        </v-col>

        <!-- Bio -->
        <v-col cols="12">
          <div class="modern-field-group">
            <label class="modern-label">Bio</label>
            <v-textarea
              v-model="modelValue.bio"
              variant="solo-filled"
              flat
              density="comfortable"
              placeholder="Brief description about the user..."
              prepend-inner-icon="mdi-text"
              rows="3"
              @update:model-value="updateField('bio', $event)"
              class="modern-input"
            />
          </div>
        </v-col>

        <!-- Send Welcome Email -->
        <v-col cols="12">
          <div class="welcome-email-card">
            <div class="email-icon">
              <v-icon size="24" color="primary">mdi-email-fast-outline</v-icon>
            </div>
            <div class="email-content">
              <v-switch
                v-model="modelValue.sendEmail"
                color="primary"
                hide-details
                density="compact"
                @update:model-value="updateField('sendEmail', $event)"
              >
                <template #label>
                  <div class="email-label">
                    <div class="email-title">Send Welcome Email</div>
                    <div class="email-subtitle">
                      User will receive login instructions at their email address
                    </div>
                  </div>
                </template>
              </v-switch>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { validationRules } from '../../../utils/userValidation'
import { regionOptions, formatPhoneNumber } from '../../../utils/userConstants'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// Phone formatting
const formattedPhone = computed({
  get() {
    return formatPhoneNumber(props.modelValue.phone)
  },
  set(value) {
    const numericOnly = String(value).replace(/\D/g, '')
    updateField('phone', numericOnly)
  }
})

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}
</script>

<style scoped>
/* Modern form container */
.form-container {
  padding: 32px 0;
}

/* Modern field styling */
.modern-field-group {
  margin-bottom: 24px;
}

.modern-label {
  display: block;
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}

/* Modern input styling */
.modern-input :deep(.v-field) {
  background-color: #f5f6f7;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.modern-input :deep(.v-field:hover) {
  background-color: #eef0f2;
}

.modern-input :deep(.v-field--focused) {
  background-color: #ffffff;
  box-shadow: 0 0 0 2px #1976d2;
}

.modern-input :deep(.v-field__input) {
  font-family: 'Cambria', Georgia, serif;
  font-size: 1rem;
  padding-top: 0.75rem !important;
  padding-bottom: 0.75rem !important;
}

.modern-input :deep(.v-field__prepend-inner) {
  opacity: 0.6;
  margin-right: 4px;
}

.modern-input :deep(.v-field--focused .v-field__prepend-inner) {
  opacity: 1;
  color: #1976d2;
}

/* Placeholder styling */
.modern-input :deep(.v-field__input::placeholder) {
  color: #9e9e9e;
  opacity: 1;
}

/* Textarea specific */
.modern-input :deep(textarea) {
  font-family: 'Cambria', Georgia, serif;
  line-height: 1.5;
}

/* Welcome email card */
.welcome-email-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3f4f6 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.welcome-email-card:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.email-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.email-content {
  flex: 1;
}

.email-label {
  margin-left: 8px;
}

.email-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 600;
  color: #1a1a1a;
  font-size: 0.9375rem;
  margin-bottom: 2px;
}

.email-subtitle {
  font-family: 'Cambria', Georgia, serif;
  font-size: 0.8125rem;
  color: #666;
  line-height: 1.4;
}

/* Hide solo variant outline */
.modern-input :deep(.v-field__outline) {
  display: none;
}

/* Better error message styling */
.modern-input :deep(.v-messages) {
  font-size: 0.75rem;
  margin-top: 4px;
}

/* Switch styling */
:deep(.v-switch .v-selection-control) {
  min-height: auto;
}

:deep(.v-switch .v-label) {
  opacity: 1 !important;
}
</style>