<!-- client/src/components/comms/projects/ProjectFormStepper.vue -->
<template>
  <div class="stepper-container bg-grey-lighten-4">
    <div class="d-flex align-center justify-center py-4 px-4">
      <template v-for="(step, index) in steps" :key="step.id">
        <!-- Step -->
        <div 
          class="stepper-step" 
          :class="{ 
            'stepper-step--active': currentStep === step.id, 
            'stepper-step--completed': currentStep > step.id 
          }"
        >
          <div class="stepper-circle">
            <v-icon v-if="currentStep > step.id" size="18">mdi-check</v-icon>
            <span v-else>{{ step.id }}</span>
          </div>
          
          <div class="stepper-label d-none d-sm-block ml-2">
            <div class="text-subtitle-2 font-weight-bold">{{ step.title }}</div>
            <div class="text-caption text-grey-darken-1">{{ step.subtitle }}</div>
          </div>
        </div>
        
        <!-- Divider (not after last step) -->
        <div 
          v-if="index < steps.length - 1"
          class="stepper-line mx-4" 
          :class="{ 'stepper-line--completed': currentStep > step.id }"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  currentStep: {
    type: Number,
    required: true
  },
  steps: {
    type: Array,
    required: true,
    validator: (steps) => {
      return steps.every(step => 
        step.hasOwnProperty('id') && 
        step.hasOwnProperty('title') && 
        step.hasOwnProperty('subtitle')
      )
    }
  }
})

// No additional logic needed - this is a pure presentation component
</script>

<style scoped>
/* Stepper container */
.stepper-container {
  border-bottom: 1px solid rgb(224, 224, 224);
}

/* Step styling */
.stepper-step {
  display: flex;
  align-items: center;
  opacity: 0.5;
  transition: all 0.3s ease;
  min-width: fit-content;
}

.stepper-step--active {
  opacity: 1;
}

.stepper-step--completed {
  opacity: 1;
}

/* Step circle */
.stepper-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(224, 224, 224);
  color: rgb(117, 117, 117);
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.stepper-step--active .stepper-circle {
  background-color: rgb(25, 118, 210);
  color: white;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.12);
}

.stepper-step--completed .stepper-circle {
  background-color: rgb(76, 175, 80);
  color: white;
}

/* Step labels */
.stepper-label {
  margin-left: 8px;
}

.stepper-label .text-subtitle-2 {
  font-size: 0.875rem;
  line-height: 1.2;
  margin-bottom: 2px;
}

.stepper-label .text-caption {
  font-size: 0.75rem;
  line-height: 1.2;
}

.stepper-step--active .stepper-label .text-subtitle-2 {
  color: rgb(25, 118, 210);
}

/* Connecting lines */
.stepper-line {
  flex: 1;
  height: 2px;
  background-color: rgb(224, 224, 224);
  position: relative;
  overflow: hidden;
  min-width: 40px;
  max-width: 80px;
}

.stepper-line::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 0%;
  background-color: rgb(76, 175, 80);
  transition: width 0.3s ease;
}

.stepper-line--completed::after {
  width: 100%;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .stepper-label {
    display: none !important;
  }
  
  .stepper-line {
    min-width: 30px;
    max-width: 50px;
    margin-left: 12px !important;
    margin-right: 12px !important;
  }
  
  .stepper-container .d-flex {
    padding-left: 16px;
    padding-right: 16px;
  }
}

@media (max-width: 400px) {
  .stepper-circle {
    width: 28px;
    height: 28px;
    font-size: 0.8125rem;
  }
  
  .stepper-line {
    min-width: 20px;
    max-width: 40px;
    margin-left: 8px !important;
    margin-right: 8px !important;
  }
}
</style>