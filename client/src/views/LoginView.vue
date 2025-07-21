<template>
  <div class="login-screen">
    <div class="login-container">
      <!-- LDH Logo Section (matching LoadingScreen) -->
      <div class="logo-section">
        <div class="logo-placeholder">
          <div class="logo-cross">
            <div class="cross-vertical"></div>
            <div class="cross-horizontal"></div>
          </div>
        </div>
        <div class="logo-text">
          <div class="dept-text">LOUISIANA</div>
          <div class="health-text">DEPARTMENT OF HEALTH</div>
        </div>
      </div>

      <!-- Platform Header -->
      <div class="platform-header">
        <h1 class="platform-title">BRCO</h1>
        <p class="platform-subtitle">Public Health Platform</p>
      </div>

      <!-- Login Form Component -->
      <LoginForm />
    </div>
  </div>
</template>

<script setup>
import LoginForm from '@/components/auth/LoginForm.vue'
</script>

<style scoped>
/* Main Layout */
.login-screen {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, 
    #003057 0%,     /* LDH Dark Blue */
    #426DA9 50%,    /* LDH Medium Blue */
    #63B1BC 80%,    /* LDH Light Blue/Teal */
    #8ba3c7 100%    /* Subtle Blue-Gray (toned down from gold) */
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  overflow: hidden;
}

.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 480px;
  text-align: center;
}

/* LDH Logo Section (matching LoadingScreen) */
.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.2s forwards;
}

.logo-placeholder {
  position: relative;
  width: 48px;
  height: 48px;
  margin-right: 16px;
}

.logo-cross {
  position: relative;
  width: 100%;
  height: 100%;
}

.cross-vertical {
  position: absolute;
  left: 50%;
  top: 0;
  width: 16px;
  height: 100%;
  background: #63B1BC; /* Teal - matches LoadingScreen */
  transform: translateX(-50%);
  opacity: 0;
  animation: fadeIn 0.6s ease-out 0.4s forwards;
}

.cross-horizontal {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 16px;
  background: #B89D18; /* Gold - matches LoadingScreen */
  transform: translateY(-50%);
  opacity: 0;
  animation: fadeIn 0.6s ease-out 0.6s forwards;
}

.logo-text {
  text-align: left;
}

.dept-text {
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: #B89D18; /* Gold */
  margin-bottom: 2px;
  opacity: 0;
  animation: fadeIn 0.6s ease-out 0.8s forwards;
}

.health-text {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: white;
  opacity: 0;
  animation: fadeIn 0.6s ease-out 1s forwards;
}

/* Platform Header */
.platform-header {
  margin-bottom: 2rem;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.4s forwards;
}

.platform-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.02em;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.platform-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
  letter-spacing: 0.05em;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .login-container {
    max-width: 100%;
  }
  
  .platform-title {
    font-size: 2rem;
  }
}
</style>