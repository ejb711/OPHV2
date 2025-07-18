<!-- client/src/components/LoadingScreen.vue -->
<template>
  <div class="loading-screen">
    <div class="loading-container">
      <!-- LDH Logo Area -->
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

      <!-- Loading Content -->
      <div class="loading-content">
        <h1 class="platform-title">BRCO</h1>
        <p class="loading-subtitle">Public Health Platform</p>
        
        <!-- Animated Loading Indicator -->
        <div class="loading-indicator">
          <div class="loading-dots">
            <div class="dot dot-1"></div>
            <div class="dot dot-2"></div>
            <div class="dot dot-3"></div>
          </div>
          <p class="loading-text">loading</p>
        </div>
      </div>

      <!-- Progress Wave Animation -->
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
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #003057 0%, #426DA9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
}

.loading-container {
  text-align: center;
  color: white;
  position: relative;
  max-width: 400px;
  padding: 2rem;
}

/* Logo Section */
.logo-section {
  margin-bottom: 3rem;
  opacity: 0;
  animation: fadeInUp 1s ease-out 0.3s forwards;
}

.logo-placeholder {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  position: relative;
  background: #63B1BC;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.logo-cross {
  position: relative;
  width: 32px;
  height: 32px;
}

.cross-vertical, .cross-horizontal {
  position: absolute;
  background: white;
  border-radius: 2px;
}

.cross-vertical {
  width: 6px;
  height: 32px;
  left: 13px;
  top: 0;
}

.cross-horizontal {
  width: 32px;
  height: 6px;
  left: 0;
  top: 13px;
}

.logo-text {
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  line-height: 1.2;
}

.department-text {
  font-size: 0.875rem;
  letter-spacing: 1px;
  color: #B89D18;
  margin-bottom: 0.25rem;
}

.health-text {
  font-size: 1rem;
  letter-spacing: 0.5px;
  color: white;
  font-weight: 900;
}

/* Loading Content */
.loading-content {
  opacity: 0;
  animation: fadeInUp 1s ease-out 0.6s forwards;
}

.platform-title {
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: 3rem;
  font-weight: 900;
  color: white;
  margin: 0 0 0.5rem 0;
  letter-spacing: 2px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.loading-subtitle {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1.125rem;
  color: #63B1BC;
  margin: 0 0 2rem 0;
  font-style: italic;
}

/* Loading Indicator */
.loading-indicator {
  opacity: 0;
  animation: fadeInUp 1s ease-out 0.9s forwards;
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
}

/* Wave Animation */
.wave-container {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 60px;
  overflow: hidden;
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(99, 177, 188, 0.1) 25%, 
    rgba(184, 157, 24, 0.1) 50%, 
    rgba(99, 177, 188, 0.1) 75%, 
    transparent 100%
  );
  border-radius: 50px 50px 0 0;
  animation: wave 3s ease-in-out infinite;
}

.wave-1 { animation-delay: 0s; opacity: 0.3; }
.wave-2 { animation-delay: -1s; opacity: 0.2; }
.wave-3 { animation-delay: -2s; opacity: 0.1; }

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
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .loading-container {
    padding: 1.5rem;
    max-width: 320px;
  }
  
  .platform-title {
    font-size: 2.5rem;
  }
  
  .logo-placeholder {
    width: 60px;
    height: 60px;
  }
  
  .logo-cross {
    width: 24px;
    height: 24px;
  }
  
  .cross-vertical {
    width: 4px;
    height: 24px;
    left: 10px;
  }
  
  .cross-horizontal {
    width: 24px;
    height: 4px;
    top: 10px;
  }
}

/* Dark mode considerations */
@media (prefers-reduced-motion: reduce) {
  .dot,
  .wave {
    animation-duration: 2s;
  }
  
  .loading-screen {
    animation: none;
  }
}
</style>