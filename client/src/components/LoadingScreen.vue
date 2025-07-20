<!-- client/src/components/LoadingScreen.vue -->
<template>
  <div class="loading-screen">
    <div class="loading-container">
      <!-- LDH Logo Area (matching LoginView) -->
      <div class="logo-section">
        <div class="logo-placeholder">
          <div class="logo-cross">
            <div class="cross-vertical"></div>
            <div class="cross-horizontal"></div>
          </div>
        </div>
        <div class="logo-text">
          <div class="department-text">LOUISIANA</div>
          <div class="health-text">DEPARTMENT OF HEALTH</div>
        </div>
      </div>

      <!-- Platform Header -->
      <div class="platform-header">
        <h1 class="platform-title">BRCO</h1>
        <p class="platform-subtitle">Public Health Platform</p>
      </div>
      
      <!-- Loading Content -->
      <div class="loading-content">
        <!-- Animated Loading Indicator -->
        <div class="loading-indicator">
          <div class="loading-dots">
            <div class="dot dot-1"></div>
            <div class="dot dot-2"></div>
            <div class="dot dot-3"></div>
          </div>
          <p class="loading-text">Loading</p>
        </div>
      </div>

      <!-- Subtle Wave Animation (matching LoginView) -->
      <div class="wave-container">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Simple static loading screen - no dynamic content needed
console.log('[LoadingScreen] Mounted')
</script>

<style scoped>
/* Main Layout */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, 
    #003057 0%,     /* LDH Dark Blue */
    #426DA9 50%,    /* LDH Medium Blue */
    #63B1BC 80%,    /* LDH Light Blue/Teal */
    #8ba3c7 100%    /* Subtle Blue-Gray (toned down from gold) */
  );
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
}

.loading-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 480px;
  text-align: center;
  padding: 2rem 1rem;
}

/* LDH Logo Section (matching LoginView) */
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
  margin-right: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-cross {
  position: relative;
  width: 24px;
  height: 24px;
}

.cross-vertical {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 20px;
  background: #63B1BC;
  border-radius: 2px;
}

.cross-horizontal {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 4px;
  background: #B89D18;
  border-radius: 2px;
}

.logo-text {
  text-align: left;
  font-weight: 700;
  line-height: 1.2;
}

.department-text {
  font-size: 0.75rem;
  letter-spacing: 1px;
  color: #B89D18;
  margin-bottom: 0.25rem;
}

.health-text {
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  color: white;
  font-weight: 900;
}

/* Platform Header */
.platform-header {
  margin-bottom: 2rem;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.4s forwards;
}

.platform-title {
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  color: white;
  margin: 0 0 0.5rem 0;
  letter-spacing: 1.5px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.platform-subtitle {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1rem;
  color: #63B1BC;
  margin: 0;
  font-style: italic;
}

/* Loading Content */
.loading-content {
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.6s forwards;
}

/* Loading Indicator */
.loading-indicator {
  margin-top: 1rem;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #B89D18;
  animation: pulse 1.5s ease-in-out infinite;
}

.dot-1 { animation-delay: 0s; }
.dot-2 { animation-delay: 0.3s; }
.dot-3 { animation-delay: 0.6s; }

.loading-text {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  letter-spacing: 0.5px;
  text-transform: lowercase;
}

/* Wave Animation (matching LoginView) */
.wave-container {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 60px;
  overflow: hidden;
  z-index: 1;
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(99, 177, 188, 0.1) 30%, 
    rgba(139, 163, 199, 0.08) 50%, 
    rgba(99, 177, 188, 0.1) 70%, 
    transparent 100%
  );
  border-radius: 50px 50px 0 0;
  animation: wave 3s ease-in-out infinite;
}

.wave-1 {
  animation-delay: 0s;
}

.wave-2 {
  animation-delay: 0.5s;
  opacity: 0.8;
}

.wave-3 {
  animation-delay: 1s;
  opacity: 0.6;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

@keyframes wave {
  0%, 100% {
    transform: translateX(-50%);
  }
  50% {
    transform: translateX(-30%);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .loading-container {
    padding: 1rem;
    max-width: 320px;
  }
  
  .platform-title {
    font-size: 2rem;
  }
  
  .logo-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .logo-placeholder {
    margin-right: 0;
  }
  
  .logo-text {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .loading-container {
    padding: 1.5rem 1rem;
  }
  
  .platform-title {
    font-size: 1.75rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .logo-placeholder {
    border: 2px solid white;
  }
  
  .loading-dots .dot {
    background: white;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .logo-section,
  .platform-header,
  .loading-content {
    animation: none;
    opacity: 1;
  }
  
  .dot,
  .wave {
    animation: none;
  }
}
</style>