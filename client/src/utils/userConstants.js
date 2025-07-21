// client/src/utils/userConstants.js

// Louisiana regions
export const regionOptions = [
  { title: 'Region 1 - Orleans', value: '1' },
  { title: 'Region 2 - Baton Rouge', value: '2' },
  { title: 'Region 3 - Houma', value: '3' },
  { title: 'Region 4 - Lafayette', value: '4' },
  { title: 'Region 5 - Lake Charles', value: '5' },
  { title: 'Region 6 - Alexandria', value: '6' },
  { title: 'Region 7 - Shreveport', value: '7' },
  { title: 'Region 8 - Monroe', value: '8' },
  { title: 'Region 9 - Hammond', value: '9' },
  { title: 'Central Office', value: 'central' }
]

// Role color mappings
export const getRoleColor = (roleId) => {
  const colors = {
    'owner': 'deep-purple',
    'admin': 'blue', 
    'user': 'success',
    'viewer': 'info',
    'pending': 'warning'
  }
  return colors[roleId] || 'grey'
}

// Phone number formatter
export const formatPhoneNumber = (value) => {
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

// Default form values
export const defaultFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  role: 'user',
  phone: '',
  department: '',
  title: '',
  region: '',
  location: '',
  bio: '',
  sendEmail: true
}