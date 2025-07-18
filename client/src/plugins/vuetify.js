// client/src/plugins/vuetify.js - Enhanced LDH Theme Configuration
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export const vuetify = createVuetify({
  blueprint: md3,
  
  // Icon configuration
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  
  theme: {
    defaultTheme: 'ldhTheme',
    
    themes: {
      ldhTheme: {
        dark: false,
        
        colors: {
          // Primary LDH Brand Colors
          primary:   '#003057',  // LDH Navy - primary actions, headers
          secondary: '#63B1BC',  // LDH Aqua - secondary elements
          accent:    '#B89D18',  // LDH Gold - highlights, CTAs
          info:      '#426DA9',  // LDH Blue - informational elements
          
          // Status Colors (web-safe alternatives)
          success:   '#34A853',  // Green for success states
          warning:   '#FBBC04',  // Yellow for warnings
          error:     '#EA4335',  // Red for errors
          
          // Background Colors
          background: '#F8F9FA', // Light gray background
          surface:    '#FFFFFF', // Card/surface background
          
          // Text Colors
          'on-primary':    '#FFFFFF',
          'on-secondary':  '#FFFFFF',
          'on-accent':     '#FFFFFF',
          'on-success':    '#FFFFFF',
          'on-warning':    '#000000',
          'on-error':      '#FFFFFF',
          'on-info':       '#FFFFFF',
          'on-background': '#202124',
          'on-surface':    '#202124',
          
          // Gray Scale
          'grey-lighten-5': '#F8F9FA',
          'grey-lighten-4': '#F1F3F4',
          'grey-lighten-3': '#E8EAED',
          'grey-lighten-2': '#DADCE0',
          'grey-lighten-1': '#BDC1C6',
          'grey':           '#9AA0A6',
          'grey-darken-1':  '#80868B',
          'grey-darken-2':  '#5F6368',
          'grey-darken-3':  '#3C4043',
          'grey-darken-4':  '#202124',
          
          // Additional LDH Colors for specific use cases
          'ldh-navy':    '#003057',
          'ldh-blue':    '#426DA9',
          'ldh-gold':    '#B89D18',
          'ldh-aqua':    '#63B1BC',
          'ldh-teal':    '#00B7C2',
        },
      },
    },
  },
  
  defaults: {
    // Global component defaults for consistent LDH styling
    
    VBtn: {
      style: [
        {
          'font-family': 'ITC Franklin Gothic, Arial Black, sans-serif',
          'font-weight': '500',
          'text-transform': 'none',
          'letter-spacing': '0',
          'border-radius': '8px',
        }
      ],
      class: 'opacity-100',
    },
    
    VCard: {
      style: [
        {
          'border-radius': '12px',
          'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }
      ],
    },
    
    VCardTitle: {
      style: [
        {
          'font-family': 'ITC Franklin Gothic, Arial Black, sans-serif',
          'font-weight': '600',
          'color': '#003057',
        }
      ],
    },
    
    VCardText: {
      style: [
        {
          'font-family': 'Cambria, Times New Roman, serif',
          'line-height': '1.6',
        }
      ],
    },
    
    VChip: {
      style: [
        {
          'font-family': 'ITC Franklin Gothic, Arial Black, sans-serif',
          'font-weight': '500',
          'border-radius': '8px',
        }
      ],
    },

    VCheckbox: {
      color: 'primary',
      baseColor: 'grey-darken-3',
      class: 'opacity-100',
      density: 'comfortable',
    },
    
    VRadio: {
      color: 'primary',
      baseColor: 'grey-darken-3',
      class: 'opacity-100',
      density: 'comfortable',
    },
    
    VSwitch: {
      color: 'primary',
      baseColor: 'grey-darken-1',
      class: 'opacity-100',
      density: 'comfortable',
    },
    
    VTextField: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
      style: [
        {
          'font-family': 'Cambria, Times New Roman, serif',
        }
      ],
    },
    
    VSelect: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
      style: [
        {
          'font-family': 'Cambria, Times New Roman, serif',
        }
      ],
    },
    
    VTextarea: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
      style: [
        {
          'font-family': 'Cambria, Times New Roman, serif',
        }
      ],
    },
    
    VDataTable: {
      style: [
        {
          'border-radius': '12px',
          'font-family': 'Cambria, Times New Roman, serif',
        }
      ],
    },
    
    VTab: {
      style: [
        {
          'font-family': 'ITC Franklin Gothic, Arial Black, sans-serif',
          'font-weight': '500',
          'text-transform': 'none',
          'letter-spacing': '0',
        }
      ],
    },
    
    VAlert: {
      style: [
        {
          'font-family': 'Cambria, Times New Roman, serif',
          'border-radius': '8px',
        }
      ],
    },
    
    VAppBar: {
      color: 'primary',
      style: [
        {
          'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }
      ],
    },
    
    VAppBarTitle: {
      style: [
        {
          'font-family': 'ITC Franklin Gothic, Arial Black, sans-serif',
          'font-weight': '700',
          'font-size': '1.5rem',
        }
      ],
    },
    
    VDialog: {
      style: [
        {
          'border-radius': '12px',
          'box-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }
      ],
    },
    
    VExpansionPanel: {
      style: [
        {
          'border-radius': '8px',
        }
      ],
    },
    
    VExpansionPanelTitle: {
      style: [
        {
          'font-family': 'ITC Franklin Gothic, Arial Black, sans-serif',
          'font-weight': '500',
        }
      ],
    },
    
    VProgressLinear: {
      color: 'primary',
      style: [
        {
          'border-radius': '8px',
        }
      ],
    },
    
    VSkeletonLoader: {
      style: [
        {
          'border-radius': '12px',
        }
      ],
    },
    
    // Icon visibility fix
    VIcon: {
      class: 'opacity-100',
    },
  },
  
  // Display configuration for responsive breakpoints
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1264,
      xl: 1904,
    },
  },
})