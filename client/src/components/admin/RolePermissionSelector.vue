<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'RolePermissionSelector',
  props: {
    form: {
      type: Object,
      required: true
    },
    permissionsByCategory: {
      type: Object,
      required: true
    },
    permissionCategories: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const expandedPanels = ref([]);

    function togglePermission(permissionId) {
      const permissions = props.form.permissions || [];
      const index = permissions.indexOf(permissionId);
      if (index === -1) {
        permissions.push(permissionId);
      } else {
        permissions.splice(index, 1);
      }
      props.form.permissions = [...permissions];
    }

    function toggleAllInCategory(category) {
      const categoryPermissions = props.permissionsByCategory[category] || [];
      const permissions = props.form.permissions || [];
      const hasAll = categoryPermissions.every(p => permissions.includes(p.id));
      if (hasAll) {
        props.form.permissions = permissions.filter(id => !categoryPermissions.some(p => p.id === id));
      } else {
        const newPermissions = new Set(permissions);
        categoryPermissions.forEach(p => newPermissions.add(p.id));
        props.form.permissions = Array.from(newPermissions);
      }
    }

    function formatPermissionName(permission) {
      return permission.name || permission.id;
    }

    function getCategoryIcon(category) {
      const icons = {
        analytics: 'mdi-chart-bar',
        admin: 'mdi-account-cog',
        users: 'mdi-account',
        roles: 'mdi-account-group',
        permissions: 'mdi-shield-lock',
        profile: 'mdi-account-box'
      };
      return icons[category] || 'mdi-folder';
    }

    return {
      expandedPanels,
      togglePermission,
      toggleAllInCategory,
      formatPermissionName,
      getCategoryIcon
    };
  }
});
</script>

<template>
  <v-expansion-panels v-model="expandedPanels" multiple accordion>
    <v-expansion-panel
      v-for="category in permissionCategories"
      :key="category"
    >
      <v-expansion-panel-title>
        <v-icon :icon="getCategoryIcon(category)" size="small" class="mr-1" />
        <span class="font-weight-bold">{{ category }}</span>
        <template #actions>
          <v-checkbox
            hide-details
            size="x-small"
            :model-value="(form.permissions || []).length > 0 && (permissionsByCategory[category] || []).every(p => (form.permissions || []).includes(p.id))"
            @update:model-value="() => toggleAllInCategory(category)"
          />
        </template>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <v-list density="compact">
          <v-list-item
            v-for="permission in permissionsByCategory[category] || []"
            :key="permission.id"
            class="px-0"
            @click.stop=""
          >
            <template #prepend>
              <v-checkbox
                hide-details
                size="x-small"
                :label="formatPermissionName(permission)"
                :model-value="(form.permissions || []).includes(permission.id)"
                @update:model-value="() => togglePermission(permission.id)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<style scoped>
/* Add any scoped styles if necessary */
</style><script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'RolePermissionSelector',
  props: {
    form: {
      type: Object,
      required: true
    },
    permissionsByCategory: {
      type: Object,
      required: true
    },
    permissionCategories: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const expandedPanels = ref([]);

    function togglePermission(permissionId) {
      const formPermissions = props.form.permissions || [];
      const index = formPermissions.indexOf(permissionId);
      if (index === -1) {
        formPermissions.push(permissionId);
      } else {
        formPermissions.splice(index, 1);
      }
      props.form.permissions = [...formPermissions];
    }

    function toggleAllInCategory(category) {
      const categoryPermissions = props.permissionsByCategory[category] || [];
      const formPermissions = props.form.permissions || [];
      const hasAll = (categoryPermissions || []).every(p => formPermissions.includes(p.id));
      if (hasAll) {
        props.form.permissions = formPermissions.filter(id => !categoryPermissions.some(p => p.id === id));
      } else {
        const newPermissions = new Set(formPermissions);
        categoryPermissions.forEach(p => newPermissions.add(p.id));
        props.form.permissions = Array.from(newPermissions);
      }
    }

    function formatPermissionName(permission) {
      return permission.name || permission.id;
    }

    function getCategoryIcon(category) {
      const icons = {
        analytics: 'mdi-chart-bar',
        admin: 'mdi-account-cog',
        users: 'mdi-account',
        roles: 'mdi-account-group',
        permissions: 'mdi-shield-lock',
        profile: 'mdi-account-box'
      };
      return icons[category] || 'mdi-folder';
    }

    return {
      expandedPanels,
      togglePermission,
      toggleAllInCategory,
      formatPermissionName,
      getCategoryIcon
    };
  }
});
</script>

<template>
  <v-expansion-panels v-model="expandedPanels" multiple accordion><script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'RolePermissionSelector',
  props: {
    form: {
      type: Object,
      required: true
    },
    permissionsByCategory: {
      type: Object,
      required: true
    },
    permissionCategories: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const expandedPanels = ref([]);

    function togglePermission(permissionId) {
      const formPermissions = props.form.permissions || [];
      const index = formPermissions.indexOf(permissionId);
      if (index === -1) {
        formPermissions.push(permissionId);
      } else {
        formPermissions.splice(index, 1);
      }
      props.form.permissions = [...formPermissions];
    }

    function toggleAllInCategory(category) {
      const categoryPermissions = props.permissionsByCategory[category] || [];
      const formPermissions = props.form.permissions || [];
      const hasAll = (categoryPermissions || []).every(p => formPermissions.includes(p.id));
      if (hasAll) {
        props.form.permissions = formPermissions.filter(id => !categoryPermissions.some(p => p.id === id));
      } else {
        const newPermissions = new Set(formPermissions);
        categoryPermissions.forEach(p => newPermissions.add(p.id));
        props.form.permissions = Array.from(newPermissions);
      }
    }

    function formatPermissionName(permission) {
      return permission.name || permission.id;
    }

    function getCategoryIcon(category) {
      const icons = {
        analytics: 'mdi-chart-bar',
        admin: 'mdi-account-cog',
        users: 'mdi-account',
        roles: 'mdi-account-group',
        permissions: 'mdi-shield-lock',
        profile: 'mdi-account-box'
      };
      return icons[category] || 'mdi-folder';
    }

    return {
      expandedPanels,
      togglePermission,
      toggleAllInCategory,
      formatPermissionName,
      getCategoryIcon
    };
  }
});
</script>

<template>
  <v-expansion-panels v-model="expandedPanels" multiple accordion>
    <v-expansion-panel
      v-for="category in permissionCategories"
      :key="category"
    >
      <v-expansion-panel-title>
        <v-icon :icon="getCategoryIcon(category)" size="small" class="mr-1" />
        <span class="font-weight-bold">{{ category }}</span>
        <template #actions>
          <v-checkbox
            hide-details
            size="x-small"
            :model-value="(form.permissions || []).length > 0 && (permissionsByCategory[category] || []).every(p => (form.permissions || []).includes(p.id))"
            @update:model-value="() => toggleAllInCategory(category)"
          />
        </template>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-list density="compact">
          <v-list-item
            v-for="permission in permissionsByCategory[category] || []"
            :key="permission.id"
            class="px-0"
            @click.stop=""
          >
            <template #prepend>
              <v-checkbox
                hide-details
                size="x-small"
                :label="formatPermissionName(permission)"
                :model-value="(form.permissions || []).includes(permission.id)"
                @update:model-value="() => togglePermission(permission.id)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<style scoped>
/* Add any scoped styles if necessary */
</style>
    <v-expansion-panel
      v-for="category in permissionCategories"
      :key="category"
    >
      <v-expansion-panel-title>
        <v-icon :icon="getCategoryIcon(category)" size="small" class="mr-1" />
        <span class="font-weight-bold">{{ category }}</span>
        <template #actions>
          <v-checkbox
            hide-details
            size="x-small"
            :model-value="(form.permissions || []).length > 0 && (permissionsByCategory[category] || []).every(p => (form.permissions || []).includes(p.id))"
            @update:model-value="() => toggleAllInCategory(category)"
          />
        </template>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-list density="compact">
          <v-list-item
            v-for="permission in permissionsByCategory[category] || []"
            :key="permission.id"
            class="px-0"
            @click.stop=""
          >
            <template #prepend>
              <v-checkbox
                hide-details
                size="x-small"
                :label="formatPermissionName(permission)"
                :model-value="(form.permissions || []).includes(permission.id)"
                @update:model-value="() => togglePermission(permission.id)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<style scoped>
/* Add any scoped styles if necessary */
</style>
