<!-- client/src/components/admin/user-form/AccountDetailsStep.vue -->
<template>
  <div class="form-container">
    <v-container fluid>
      <v-row>
        <!-- Email Field -->
        <v-col cols="12">
          <div class="modern-field-group">
            <label class="modern-label">
              Email Address
              <span class="required-star">*</span>
            </label>
            <v-text-field
              v-model="modelValue.email"
              type="email"
              variant="solo-filled"
              flat
              density="comfortable"
              placeholder="user@example.com"
              prepend-inner-icon="mdi-email-outline"
              :rules="validationRules.emailRules"
              @update:model-value="updateField('email', $event)"
              class="modern-input"
            />
          </div>
        </v-col>

        <!-- Display Name Field -->
        <v-col cols="12">
          <div class="modern-field-group">
            <label class="modern-label">
              Display Name
              <span class="required-star">*</span>
            </label>
            <v-text-field
              v-model="modelValue.displayName"
              variant="solo-filled"
              flat
              density="comfortable"
              placeholder="Enter full name"
              prepend-inner-icon="mdi-account-outline"
              :rules="validationRules.displayNameRules"
              @update:model-value="updateField('displayName', $event)"
              class="modern-input"
            />
          </div>
        </v-col>

        <!-- Password Fields -->
        <v-col cols="12" md="6">
          <div class="modern-field-group">
            <label class="modern-label">
              Password
              <span class="required-star">*</span>
            </label>
            <v-text-field
              v-model="modelValue.password"
              :type="showPassword ? 'text' : 'password'"
              variant="solo-filled"
              flat
              density="comfortable"
              placeholder="Enter password"
              prepend-inner-icon="mdi-lock-outline"
              :rules="validationRules.passwordRules"
              @update:model-value="updateField('password', $event)"
              class="modern-input"
            >
              <template #append-inner>
                <v-btn
                  :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  size="x-small"
                  variant="text"
                  @click="$emit('toggle-password')"
                />
                <v-tooltip text="Generate Strong Password" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-auto-fix"
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="$emit('generate-password')"
                    />
                  </template>
                </v-tooltip>
              </template>
            </v-text-field>
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <div class="modern-field-group">
            <label class="modern-label">
              Confirm Password
              <span class="required-star">*</span>
            </label>
            <v-text-field
              v-model="modelValue.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              variant="solo-filled"
              flat
              density="comfortable"
              placeholder="Confirm password"
              prepend-inner-icon="mdi-lock-check-outline"
              :rules="getConfirmPasswordRules(modelValue.password)"
              @update:model-value="updateField('confirmPassword', $event)"
              class="modern-input"
            >
              <template #append-inner>
                <v-btn
                  :icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  size="x-small"
                  variant="text"
                  @click="$emit('toggle-confirm-password')"
                />
              </template>
            </v-text-field>
          </div>
        </v-col>

        <!-- Role Selection -->
        <v-col cols="12">
          <div class="modern-field-group">
            <label class="modern-label">
              User Role
              <span class="required-star">*</span>
            </label>
            <v-select
              v-model="modelValue.role"
              :items="availableRoles"
              item-title="name"
              item-value="id"
              variant="solo-filled"
              flat
              density="comfortable"
              prepend-inner-icon="mdi-shield-account-outline"
              :rules="validationRules.roleRules"
              @update:model-value="updateField('role', $event)"
              class="modern-input"
            >
              <template #selection="{ item }">
                <div class="role-selection">
                  <v-chip
                    :color="getRoleColor(item.value)"
                    size="small"
                    label
                    variant="flat"
                  >
                    <v-icon start size="16">
                      {{ getRoleIcon(item.value) }}
                    </v-icon>
                    {{ item.title }}
                  </v-chip>
                </div>
              </template>
              <template #item="{ props: itemProps, item }">
                <v-list-item 
                  v-bind="itemProps"
                  :title="undefined"
                  class="role-item"
                >
                  <div class="role-item-content">
                    <v-chip
                      :color="getRoleColor(item.value)"
                      size="small"
                      label
                      variant="flat"
                    >
                      <v-icon start size="16">
                        {{ getRoleIcon(item.value) }}
                      </v-icon>
                      {{ item.title }}
                    </v-chip>
                    <span class="role-description">
                      {{ getRoleDescription(item.value) }}
                    </span>
                  </div>
                </v-list-item>
              </template>
            </v-select>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { validationRules, getConfirmPasswordRules } from '../../../utils/userValidation'
import { getRoleColor } from '../../../utils/userConstants'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  availableRoles: {
    type: Array,
    default: () => []
  },
  showPassword: {
    type: Boolean,
    default: false
  },
  showConfirmPassword: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'toggle-password',
  'toggle-confirm-password',
  'generate-password'
])

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const getRoleIcon = (roleId) => {
  const icons = {
    'admin': 'mdi-shield-crown',
    'user': 'mdi-account-circle',
    'viewer': 'mdi-eye',
    'pending': 'mdi-clock-outline'
  }
  return icons[roleId] || 'mdi-account'
}

const getRoleDescription = (roleId) => {
  const descriptions = {
    'admin': 'Full administrative access',
    'user': 'Standard user permissions',
    'viewer': 'Read-only access',
    'pending': 'Awaiting approval'
  }
  return descriptions[roleId] || ''
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

.required-star {
  color: #d32f2f;
  margin-left: 2px;
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

/* Error state */
.modern-input :deep(.v-field--error:not(.v-field--disabled) .v-field__outline) {
  color: #d32f2f;
}

/* Role selection styling */
.role-selection {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.role-item {
  padding: 12px 16px !important;
}

.role-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-description {
  font-family: 'Cambria', Georgia, serif;
  font-size: 0.75rem;
  color: #666;
  margin-left: 28px;
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
</style>