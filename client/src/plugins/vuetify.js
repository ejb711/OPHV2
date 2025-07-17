import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

export const vuetify = createVuetify({
  blueprint: md3,
  theme: {
    defaultTheme: 'ldhTheme',
    themes: {
      ldhTheme: {
        dark: false,
        colors: {
          primary:   '#003057',  // LDH navy :contentReference[oaicite:5]{index=5}
          info:      '#426DA9',  // LDH blue :contentReference[oaicite:6]{index=6}
          accent:    '#B89D18',  // LDH gold :contentReference[oaicite:7]{index=7}
          secondary: '#63B1BC',  // LDH aqua :contentReference[oaicite:8]{index=8}
        },
      },
    },
  },
})
