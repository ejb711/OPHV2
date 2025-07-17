<!-- Remove the <style scoped> section from your RoleManagementView.vue -->
<!-- Replace it with this minimal style section: -->

<style scoped>
/* Component-specific styles only - everything else is now global */

/* Statistics cards special styling */
.statistics-row .v-col:nth-child(1) .v-card {
  background: linear-gradient(135deg, var(--ldh-blue) 0%, var(--ldh-navy) 100%) !important;
  color: white !important;
}

.statistics-row .v-col:nth-child(2) .v-card {
  background: linear-gradient(135deg, var(--ldh-success) 0%, var(--ldh-aqua) 100%) !important;
  color: white !important;
}

.statistics-row .v-col:nth-child(3) .v-card {
  background: linear-gradient(135deg, var(--ldh-warning) 0%, var(--ldh-gold) 100%) !important;
  color: var(--ldh-gray-900) !important;
}

.statistics-row .v-col:nth-child(4) .v-card {
  background: linear-gradient(135deg, var(--ldh-navy) 0%, var(--ldh-gray-800) 100%) !important;
  color: white !important;
}

/* Debug section styling */
.debug-components {
  border: 2px dashed var(--ldh-warning);
  background: rgba(251, 188, 4, 0.1);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.debug-components h3 {
  color: var(--ldh-warning) !important;
  margin-bottom: var(--spacing-md);
}

/* Permission chip colors in dialogs */
.permission-dialog .v-chip {
  transition: all 0.2s ease;
}

.permission-dialog .v-chip:hover {
  transform: scale(1.05);
}
</style>

<!-- Update your template to use the debug wrapper: -->
<!-- Replace the debug components section with: -->

<div class="debug-components">
  <h3>🔧 Development Tools (Remove when ready)</h3>
  <DebugPermissions />
  <PermissionFixer />
</div>