// client/src/utils/userValidation.js

// Helper function for phone formatting (used in validation)
const formatPhoneNumber = (value) => {
  if (!value) return ''
  
  const numericOnly = String(value).replace(/\D/g, '')
  
  if (numericOnly.length === 0) return ''
  if (numericOnly.length <= 3) return numericOnly
  if (numericOnly.length <= 6) {
    return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3)}`
  }
  if (numericOnly.length <= 10) {
    return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3, 6)}-${numericOnly.slice(6)}`
  }
  return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3, 6)}-${numericOnly.slice(6, 10)}`
}

// Base validation rules
const rules = {
  required: value => !!value || 'This field is required',
  email: value => /.+@.+\..+/.test(value) || 'Email must be valid',
  minLength: (min) => value => (value && value.length >= min) || `Must be at least ${min} characters`
}

// Field-specific validation rules
export const validationRules = {
  displayNameRules: [
    rules.required,
    rules.minLength(2)
  ],

  emailRules: [
    rules.required,
    rules.email
  ],

  passwordRules: [
    rules.required,
    rules.minLength(8),
    value => /[A-Z]/.test(value) || 'Must contain an uppercase letter',
    value => /[a-z]/.test(value) || 'Must contain a lowercase letter',
    value => /[0-9]/.test(value) || 'Must contain a number'
  ],

  phoneRules: [
    value => !value || /^\(\d{3}\)\s\d{3}-\d{4}$/.test(formatPhoneNumber(value)) || 'Use format: (XXX) XXX-XXXX'
  ],

  roleRules: [
    rules.required
  ]
}

// Dynamic validation rules
export const getConfirmPasswordRules = (password) => [
  rules.required,
  value => value === password || 'Passwords must match'
]