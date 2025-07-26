// client/src/composables/useCreateUser.js
import { ref, computed } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { usePermissionsStore } from '../stores/permissions'
import { useAudit } from './useAudit'

export function useCreateUser() {
  const permissionsStore = usePermissionsStore()
  const { log } = useAudit()

  // Form state
  const creating = ref(false)
  const currentStep = ref(1)
  const totalSteps = 2
  const showPassword = ref(false)
  const showConfirmPassword = ref(false)

  // Form data
  const form = ref({
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
  })

  // Available roles (excluding owner)
  const availableRoles = computed(() => {
    return permissionsStore.allRoles.filter(role => role.id !== 'owner')
  })

  // Reset form to initial state
  const resetForm = () => {
    form.value = {
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
    currentStep.value = 1
    showPassword.value = false
    showConfirmPassword.value = false
  }

  // Generate secure password
  const generatePassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''

    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    password += '0123456789'[Math.floor(Math.random() * 10)]
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('')

    form.value.password = password
    form.value.confirmPassword = password
    showPassword.value = true
    showConfirmPassword.value = true
  }

  // Create user
  const createUser = async () => {
    creating.value = true

    try {
      const userPayload = {
        email: form.value.email.toLowerCase().trim(),
        password: form.value.password,
        displayName: form.value.displayName.trim(),
        role: form.value.role,
        phone: form.value.phone,
        department: form.value.department,
        title: form.value.title,
        region: form.value.region,
        location: form.value.location,
        bio: form.value.bio,
        sendWelcomeEmail: form.value.sendEmail
      }

      const createUserFunction = httpsCallable(functions, 'createUser')
      const result = await createUserFunction(userPayload)

      if (result.data.success) {
        await log.userCreated({
          createdUserId: result.data.userId,
          createdUserEmail: form.value.email,
          assignedRole: form.value.role,
          method: 'admin_creation',
          profileFields: {
            phone: form.value.phone || 'none',
            department: form.value.department || 'none',
            title: form.value.title || 'none',
            region: form.value.region || 'none',
            location: form.value.location || 'none',
            bio: form.value.bio || 'none'
          }
        })

        let message = 'User created successfully!'
        if (result.data.profileFieldsSaved) {
          const savedFields = Object.values(result.data.profileFieldsSaved).filter(v => v !== 'none').length
          message += ` Profile data saved: ${savedFields} fields.`
        }

        await permissionsStore.loadAllData()

        const userData = {
          userId: result.data.userId,
          email: result.data.email,
          displayName: form.value.displayName,
          role: form.value.role,
          profileData: {
            phone: form.value.phone,
            department: form.value.department,
            title: form.value.title,
            region: form.value.region,
            location: form.value.location,
            bio: form.value.bio
          },
          profileFieldsSaved: result.data.profileFieldsSaved
        }

        resetForm()
        return { success: true, message, userData }

      } else {
        throw new Error(result.data.message || 'Failed to create user')
      }

    } catch (error) {
      let errorMessage = 'Failed to create user'

      if (error.code === 'functions/already-exists') {
        errorMessage = 'A user with this email already exists'
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = 'Please check your input and try again'
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'You do not have permission to create users'
      } else if (error.message) {
        errorMessage = error.message
      }

      return { success: false, message: errorMessage }
    } finally {
      creating.value = false
    }
  }

  return {
    form,
    currentStep,
    totalSteps,
    creating,
    showPassword,
    showConfirmPassword,
    availableRoles,
    resetForm,
    generatePassword,
    createUser
  }
}